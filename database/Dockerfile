FROM postgres:16-alpine

ENV POSTGRES_USER=nfw_user \
    POSTGRES_PASSWORD=nfw_pass \
    POSTGRES_DB=nfw_db

COPY migrations /docker-entrypoint-initdb.d/
