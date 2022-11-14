import { ChangedChargePoint, ChargePoint } from "../domain/change-point.js";

export interface Sink {
  export(
    allChargePoints: ChargePoint[],
    changedChargePoints: ChangedChargePoint[]
  ): Promise<void>;
}
