export type Point = {
  color?: number;
  dates?: [string, string?][];
  lat: number;
  lon: number;
};

export type Points = Map<string, Point>;
