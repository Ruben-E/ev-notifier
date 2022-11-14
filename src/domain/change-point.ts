import { Distance } from "./distance.js";

export interface ChargePoint {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  connectors: number;
  available: number;
  distance: Distance;
}

export interface ChangedChargePoint {
  previous: ChargePoint | undefined;
  current: ChargePoint;
}
