FROM alpine:3.19

RUN apk add --no-cache curl tzdata

ENV TZ=Europe/Paris

COPY crontab /etc/crontabs/root

CMD ["crond", "-f", "-l", "8"]