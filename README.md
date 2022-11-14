# EV Notifier

## Prerequisites

- [Discord webhook](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)
- [Victoria Metrics](https://hub.docker.com/r/victoriametrics/victoria-metrics)
- [Grafana](https://hub.docker.com/r/grafana/grafana)
- ~~Mapbox~~ (not currently in-use, was used to generate static map images of the charge point location)

## Running

Two options to run the application: local and docker

### 1. Local

#### Config

Create `config/local.yml` to override properties from `default.yml` in order to run it locally:

```
discord:
  id: <webhook id>
  token: <webhook token>
distance:
  startLatitude: <latitude of your home>
  startLongitude: <longitude of your home>
influxdb:
  host: <victoria metrics host>
  port: <victorio metrics port>
chargePoints:
- <charge point ids, find via https://ui-map.shellrecharge.com>
```

```
npm install
npm run cron
```

### 2. Docker

```
docker build -t <tag>  --platform=linux/amd64 .
docker run --name ev-notifier -e CHARGEPOINTS=1,2,3 -e DISCORD_ID=id -e DISCORD_TOKEN=token -e INFLUXDB_HOST=host -e INFLUXDB_PORT=port <tag>
```
