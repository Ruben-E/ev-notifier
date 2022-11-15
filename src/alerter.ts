import fetch from "node-fetch";
import fs from "fs";
import { ChangedChargePoint, ChargePoint } from "./domain/change-point.js";
import { checkFileExists } from "./domain/utils.js";
import { Sink } from "./sinks/sink.js";
import { DiscordSink } from "./sinks/discord.js";
import { Distance } from "./domain/distance.js";
import { InfluxdbSink } from "./sinks/influxdb.js";

export class Alerter {
  sinks: Sink[] = [];
  changePointIdsToWatch: number[];

  startLatitude: number;
  startLongitude: number;

  chargePointsDataFile: string;
  distancesDataFile: string;

  constructor(
    chargePointIds: number[],
    startLatitude: number,
    startLongitude: number,
    chargePointsDataFile: string,
    distancesDataFile: string,
    discordEnabled: boolean,
    discordId: string,
    discordToken: string,
    influxdbEnabled: boolean,
    influxdbHost: string,
    influxdbPort: number,
    influxdbDatabase: string
  ) {
    console.log(`[Alerter] Alerting for charge points ${chargePointIds}`);

    this.changePointIdsToWatch = chargePointIds;
    this.startLatitude = startLatitude;
    this.startLongitude = startLongitude;
    this.chargePointsDataFile = chargePointsDataFile;
    this.distancesDataFile = distancesDataFile;

    if (discordEnabled) {
      this.sinks.push(new DiscordSink(discordId, discordToken));
    }

    if (influxdbEnabled) {
      this.sinks.push(
        new InfluxdbSink(influxdbHost, influxdbPort, influxdbDatabase)
      );
    }
  }

  async check(): Promise<void> {
    const chargePoints = [];
    for (const chargePointId of this.changePointIdsToWatch) {
      try {
        const chargePointData = await this.getChargePoint(chargePointId);
        const distance = await this.getDistanceForChargePoint(
          chargePointId,
          chargePointData.coordinates.latitude,
          chargePointData.coordinates.longitude
        );

        const chargePoint: ChargePoint = {
          id: chargePointId,
          address: chargePointData.address.streetAndNumber,
          latitude: chargePointData.coordinates.latitude,
          longitude: chargePointData.coordinates.longitude,
          connectors: chargePointData.evses.length,
          distance: distance,
          available: chargePointData.evses.filter(
            (ev: any) => ev.status === "Available"
          ).length,
        };

        chargePoints.push(chargePoint);
      } catch (e) {
        console.log("Could not fetch charge point", e);
      }
    }

    const changedChargePoints = await this.checkChangedChargePoints(
      chargePoints
    );
    await this.writeToDisk(chargePoints);
    await this.callSinks(chargePoints, changedChargePoints);
  }

  private async writeToDisk(chargePoints: ChargePoint[]) {
    await fs.promises.writeFile(
      this.chargePointsDataFile,
      JSON.stringify(chargePoints)
    );
  }

  private async callSinks(
    allChargePoints: ChargePoint[],
    changedChargePoints: ChangedChargePoint[]
  ) {
    try {
      await Promise.all(
        this.sinks.map((sink) =>
          sink.export(allChargePoints, changedChargePoints)
        )
      );
    } catch (e) {
      console.log("Could not call sink", e);
    }
  }

  private async checkChangedChargePoints(
    chargePoints: ChargePoint[]
  ): Promise<ChangedChargePoint[]> {
    const exists = await checkFileExists(this.chargePointsDataFile);
    if (exists) {
      const changedChargePoints: ChangedChargePoint[] = [];
      const previousChargePoints: ChargePoint[] = JSON.parse(
        await fs.promises.readFile(this.chargePointsDataFile, "utf-8")
      );
      for (const chargePoint of chargePoints) {
        const previousChargePoint = previousChargePoints.find(
          (e) => e.id === chargePoint.id
        );
        if (
          previousChargePoint &&
          (previousChargePoint.connectors !== chargePoint.connectors ||
            previousChargePoint.available !== chargePoint.available)
        ) {
          changedChargePoints.push({
            previous: previousChargePoint,
            current: chargePoint,
          });
        }
      }
      return changedChargePoints;
    } else {
      return chargePoints.map((chargePoint) => ({
        previous: undefined,
        current: chargePoint,
      }));
    }
  }

  private async getDistanceFromKomoot(
    chargePointLatitude: number,
    chargePointLongitude: number
  ): Promise<Distance> {
    const routeResponse = await fetch(
      `https://www.komoot.nl/api/routing/tour?sport=hike&popularity=false`,
      {
        method: "POST",
        body: JSON.stringify({
          sport: "hike",
          constitution: 3,
          path: [
            {
              location: {
                lat: this.startLatitude,
                lng: this.startLongitude,
                alt: 1.9,
              },
            },
            {
              location: {
                lat: chargePointLatitude,
                lng: chargePointLongitude,
              },
            },
          ],
          segments: [{ type: "Routed", geometry: [] }],
        }),
        headers: { "Content-Type": "application/json" },
      }
    );
    const route: any = await routeResponse.json();
    return {
      distanceInMeters: route.distance,
      durationInMinutes: route.duration,
    };
  }

  private async getDistanceForChargePoint(
    id: number,
    chargePointLatitude: number,
    chargePointLongitude: number
  ): Promise<Distance> {
    const exists = await checkFileExists(this.distancesDataFile);
    let knownDistances: Record<number, Distance> = {};

    if (exists) {
      knownDistances = JSON.parse(
        await fs.promises.readFile(this.distancesDataFile, "utf-8")
      ) as Record<number, Distance>;

      if (knownDistances[id]) {
        return knownDistances[id];
      }
    }

    const distance = await this.getDistanceFromKomoot(
      chargePointLatitude,
      chargePointLongitude
    );
    knownDistances[id] = distance;
    await fs.promises.writeFile(
      this.distancesDataFile,
      JSON.stringify(knownDistances)
    );
    return distance;
  }

  private async getChargePoint(id: number): Promise<any> {
    const response = await fetch(
      `https://ui-map.shellrecharge.com/api/map/v2/locations/${id}`
    );
    return await response.json();
  }
}
