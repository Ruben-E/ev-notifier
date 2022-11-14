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

alerter.check();
