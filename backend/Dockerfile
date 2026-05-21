FROM ballerina/ballerina:2201.13.2 AS builder

WORKDIR /app

COPY Ballerina.toml .
COPY Config.toml .
COPY main.bal .

RUN bal build

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/bin/backend.jar .
COPY --from=builder /app/Config.toml .

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "backend.jar"]