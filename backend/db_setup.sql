-- Run this manually if you prefer to set up the DB before starting the service.
-- The service also auto-creates the table on startup (via initDb()).

CREATE TABLE IF NOT EXISTS urls (
    id           SERIAL PRIMARY KEY,
    original_url TEXT        NOT NULL,
    short_code   VARCHAR(10) NOT NULL UNIQUE,
    clicks       INT         NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_code ON urls (short_code);

-- Optional: inspect data during development
-- SELECT * FROM urls ORDER BY created_at DESC;
-- SELECT short_code, clicks FROM urls WHERE short_code = 'abc123';
