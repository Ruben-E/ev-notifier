import config from "config";
import { Alerter } from "./alerter.js";

let chargePoints: number[] = config.get("chargePoints");
if (typeof chargePoints == "string") {
  chargePoints = (chargePoints as String)
    .split(",")
    .map((s) => s.trim())
    .map(Number);
}

const alerter = new Alerter(
  chargePoints,
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
