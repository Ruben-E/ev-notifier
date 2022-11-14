import { ChangedChargePoint, ChargePoint } from "../domain/change-point.js";
import { Sink } from "./sink.js";
import { WebhookClient, EmbedBuilder } from "discord.js";

export class DiscordSink implements Sink {
  webhookClient: WebhookClient;

  constructor(id: string, token: string) {
    if (!id || !token) {
      throw new Error("Discord ID or roken not provided");
    }

    console.log(
      `[Discord] Using ID ${id} token ***${token.substring(token.length - 3)}`
    );

    this.webhookClient = new WebhookClient({
      id,
      token,
    });
  }

  async export(
    allChargePoints: ChargePoint[],
    changedChargePoints: ChangedChargePoint[]
  ): Promise<void> {
    if (changedChargePoints.length > 0) {
      const embed = new EmbedBuilder();

      changedChargePoints
        // .filter(this.alertable)
        .sort(
          (a, b) =>
            a.current.distance.distanceInMeters -
            b.current.distance.distanceInMeters
        )
        .forEach((changed) =>
          embed.addFields({
            name: `${
              changed.current.address
            } (${changed.current.distance.distanceInMeters.toFixed(0)}m / ${(
              changed.current.distance.durationInMinutes / 60
            ).toFixed(0)}min)`,
            value: `[${changed.current.available} / ${
              changed.current.connectors
            }](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${changed.current.latitude},${changed.current.longitude}`
            )}) (was ${changed.previous?.available} / ${
              changed.previous?.connectors
            })`,
          })
        );

      await this.webhookClient.send({
        embeds: [embed],
      });
    }
  }

  alertable(changedChargePoint: ChangedChargePoint): boolean {
    const previous = changedChargePoint.previous;
    const current = changedChargePoint.current;

    if (!previous) return false;

    return (
      (current.available == 0 && current.available < previous.available) ||
      (current.available > 0 && previous.available == 0)
    );
  }
}
