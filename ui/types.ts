export type PinType = 'view_spot' | 'cool_spot';

export interface Pin {
  id: string;
  name: string;
  type: PinType;
  notes?: string;
  latitude: number;
  longitude: number;
  geohash?: string;
  videos?: string[];
}

export const PIN_TYPE_LABELS: Record<PinType, string> = {
  view_spot: 'View Spot',
  cool_spot: 'Cool Spot',
};
