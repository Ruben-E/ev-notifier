FROM node:alpine

VOLUME [ "/data" ]

ENV CHARGE_POINTS=charge_points
ENV MAPBOX_TOKEN=mapbox_token
ENV DISCORD_ID=discord_id
ENV DISCORD_TOKEN=discord_token
ENV INFLUXDB_HOST=influxdb_host
ENV INFLUXDB_PORT=8428

COPY build /app
COPY config /config
COPY package.json /package.json
COPY node_modules /node_modules

RUN [ "mkdir", "/data" ]

CMD [ "node", "--experimental-specifier-resolution=node", "/app/cron.js" ]