import ballerina/http;
import ballerina/sql;
import ballerina/time;
import ballerina/log;
import ballerina/random;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

configurable string dbHost     = "localhost";
configurable int    dbPort     = 5432;
configurable string dbName     = "urlshortener";
configurable string dbUser     = "aabidzimal";
configurable string dbPassword = "";
configurable string baseUrl    = "http://localhost:8080";

final postgresql:Client dbClient = check new (
    host     = dbHost,
    port     = dbPort,
    database = dbName,
    username = dbUser,
    password = dbPassword
);

type ShortenRequest record {|
    string url;
|};

type UrlRecord record {|
    int    id;
    string original_url;
    string short_code;
    int    clicks;
    string created_at;
|};

type ShortenResponse record {|
    string short_code;
    string short_url;
    string original_url;
|};

type StatsResponse record {|
    string short_code;
    string short_url;
    string original_url;
    int    clicks;
    string created_at;
|};

type ErrorResponse record {|
    string 'error;
    string message;
|};

function initDb() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS urls (
            id           SERIAL PRIMARY KEY,
            original_url TEXT        NOT NULL,
            short_code   VARCHAR(10) NOT NULL UNIQUE,
            clicks       INT         NOT NULL DEFAULT 0,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    _ = check dbClient->execute(`
        CREATE INDEX IF NOT EXISTS idx_short_code ON urls (short_code)
    `);
    log:printInfo("Database initialised successfully");
}

const string ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const int    CODE_LEN  = 6;

function generateShortCode() returns string|error {
    string code = "";
    int alphabetLen = ALPHABET.length();
    foreach int _ in 0 ..< CODE_LEN {
        int idx = check random:createIntInRange(0, alphabetLen);
        code += ALPHABET.substring(idx, idx + 1);
    }
    return code;
}

function isValidUrl(string url) returns boolean {
    return url.startsWith("http://") || url.startsWith("https://");
}

@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"]
    }
}
service / on new http:Listener(8080) {

    resource function post api/shorten(http:Caller caller, @http:Payload ShortenRequest payload)
            returns error? {

        string originalUrl = payload.url.trim();

        if originalUrl.length() == 0 {
            check caller->respond(<http:BadRequest>{
                body: <ErrorResponse>{
                    'error: "VALIDATION_ERROR",
                    message: "url field must not be empty"
                }
            });
            return;
        }

        if !isValidUrl(originalUrl) {
            check caller->respond(<http:BadRequest>{
                body: <ErrorResponse>{
                    'error: "VALIDATION_ERROR",
                    message: "url must start with http:// or https://"
                }
            });
            return;
        }

        UrlRecord|sql:Error existing = dbClient->queryRow(
            `SELECT id, original_url, short_code, clicks,
                    created_at::TEXT AS created_at
             FROM urls
             WHERE original_url = ${originalUrl}
             LIMIT 1`
        );

        if existing is UrlRecord {
            check caller->respond(<http:Ok>{
                body: <ShortenResponse>{
                    short_code:   existing.short_code,
                    short_url:    baseUrl + "/" + existing.short_code,
                    original_url: existing.original_url
                }
            });
            return;
        }

        if existing is sql:Error && !(existing is sql:NoRowsError) {
            log:printError("DB error on duplicate check", 'error = existing);
            check caller->respond(<http:InternalServerError>{
                body: <ErrorResponse>{
                    'error: "DATABASE_ERROR",
                    message: "An internal error occurred"
                }
            });
            return;
        }

        string shortCode = check generateShortCode();

        _ = check dbClient->execute(`
            INSERT INTO urls (original_url, short_code)
            VALUES (${originalUrl}, ${shortCode})
        `);

        log:printInfo("Created short code", short_code = shortCode, original_url = originalUrl);

        check caller->respond(<http:Created>{
            body: <ShortenResponse>{
                short_code:   shortCode,
                short_url:    baseUrl + "/" + shortCode,
                original_url: originalUrl
            }
        });
    }

    resource function get [string shortCode](http:Caller caller) returns error? {

        UrlRecord|sql:Error urlRow = dbClient->queryRow(
            `SELECT id, original_url, short_code, clicks,
                    created_at::TEXT AS created_at
             FROM urls
             WHERE short_code = ${shortCode}
             LIMIT 1`
        );

        if urlRow is sql:NoRowsError {
            check caller->respond(<http:NotFound>{
                body: <ErrorResponse>{
                    'error: "NOT_FOUND",
                    message: string `Short code '${shortCode}' does not exist`
                }
            });
            return;
        }

        if urlRow is sql:Error {
            log:printError("DB error on redirect", 'error = urlRow);
            check caller->respond(<http:InternalServerError>{
                body: <ErrorResponse>{
                    'error: "DATABASE_ERROR",
                    message: "An internal error occurred"
                }
            });
            return;
        }

        _ = check dbClient->execute(`
            UPDATE urls SET clicks = clicks + 1 WHERE short_code = ${shortCode}
        `);

        http:Response res = new;
        res.statusCode = 302;
        res.setHeader("Location", urlRow.original_url);
        check caller->respond(res);
    }

    resource function get api/stats/[string shortCode](http:Caller caller) returns error? {

        UrlRecord|sql:Error urlRow = dbClient->queryRow(
            `SELECT id, original_url, short_code, clicks,
                    created_at::TEXT AS created_at
             FROM urls
             WHERE short_code = ${shortCode}
             LIMIT 1`
        );

        if urlRow is sql:NoRowsError {
            check caller->respond(<http:NotFound>{
                body: <ErrorResponse>{
                    'error: "NOT_FOUND",
                    message: string `Short code '${shortCode}' does not exist`
                }
            });
            return;
        }

        if urlRow is sql:Error {
            log:printError("DB error on stats", 'error = urlRow);
            check caller->respond(<http:InternalServerError>{
                body: <ErrorResponse>{
                    'error: "DATABASE_ERROR",
                    message: "An internal error occurred"
                }
            });
            return;
        }

        check caller->respond(<http:Ok>{
            body: <StatsResponse>{
                short_code:   urlRow.short_code,
                short_url:    baseUrl + "/" + urlRow.short_code,
                original_url: urlRow.original_url,
                clicks:       urlRow.clicks,
                created_at:   urlRow.created_at
            }
        });
    }

    resource function get health(http:Caller caller) returns error? {
        check caller->respond(<http:Ok>{
            body: { status: "ok", timestamp: time:utcToString(time:utcNow()) }
        });
    }
}

public function main() returns error? {
    check initDb();
    log:printInfo("URL Shortener backend running", port = 8080, baseUrl = baseUrl);
}