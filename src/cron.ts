import cron from "node-cron";
import config from "config";
import { Alerter } from "./alerter.js";

const alerter = new Alerter(
  config.get("chargePoints"),
  config.get("distance.startLatitude"),
  config.get("distance.startLongitude"),
  config.get("data.chargePoints"),
  config.get("data.distances"),
  config.get("discord.enabled"),
  config.get("discord.id"),
  config.get("discord.token"),
  config.get("influxdb.enabled"),
  config.get("influxdb.host"),
  config.get("influxdb.port"),
  config.get("influxdb.database")
);

cron.schedule("* * * * *", async () => {
  console.log("running check every minute");
  await alerter.check();
});
