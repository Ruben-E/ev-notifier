import { ChangedChargePoint, ChargePoint } from "../domain/change-point.js";
import { Sink } from "./sink.js";
import { InfluxDB, IPoint } from "influx";

export class InfluxdbSink implements Sink {
  client: InfluxDB;

  constructor(host: string, port: number, database: string) {
    console.log(`[InfluxDB] Connecting to ${host}:${port}/${database}`);

    this.client = new InfluxDB({
      host: host,
      port: port,
      database: database,
    });
  }

  async export(
    allChargePoints: ChargePoint[],
    changedChargePoints: ChangedChargePoint[]
  ): Promise<void> {
    const points: IPoint[] = allChargePoints.map((chargePoint) => ({
      measurement: "charge_points",
      tags: {
        id: chargePoint.id.toFixed(0),
        address: chargePoint.address,
        available: chargePoint.available.toFixed(0),
        connectors: chargePoint.connectors.toFixed(0),
        distanceInMeters: chargePoint.distance.distanceInMeters.toFixed(0),
        durationInMinutes: chargePoint.distance.durationInMinutes.toFixed(0),
      },
      fields: {
        available: chargePoint.available,
        connectors: chargePoint.connectors,
      },
    }));
    await this.client.writePoints(points);
  }
}
