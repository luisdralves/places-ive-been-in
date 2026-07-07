import { colors } from "src/core/config/colors";
import type { Point } from "types/point";

type Precision = "year" | "month" | "day";

export type DateSummary = {
  header: string;
  segments: { label: string; left: number; width: number }[];
  startLabel: string;
  endLabel: string;
  start: number;
  end: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PRECISION_ORDER: Precision[] = ["year", "month", "day"];

export const getTotalTime = (dates: [string, string?][] = []) => {
  return dates.reduce((total, [start, end]) => {
    return total + (new Date(end ?? start).getTime() + DAY_MS - new Date(start).getTime());
  }, 0);
};

export const getColor = (dates: [string, string?][] = []) => {
  const totalTime = getTotalTime(dates);

  if (totalTime > 30 * DAY_MS) {
    return colors[0];
  }

  if (
    (totalTime > 14 * DAY_MS && dates.length === 1) ||
    (totalTime > 7 * DAY_MS && dates.length > 1)
  ) {
    return colors[1];
  }

  if (totalTime > 2 * DAY_MS) {
    return colors[2];
  }

  return colors[3];
};

const precisionOf = (value: string): Precision =>
  value.length === 4 ? "year" : value.length === 7 ? "month" : "day";

const coarser = (a: Precision, b: Precision): Precision =>
  PRECISION_ORDER[Math.min(PRECISION_ORDER.indexOf(a), PRECISION_ORDER.indexOf(b))];

const optionsFor = (precision: Precision): Intl.DateTimeFormatOptions =>
  precision === "year"
    ? { year: "numeric" }
    : precision === "month"
      ? { year: "numeric", month: "short" }
      : { year: "numeric", month: "short", day: "numeric" };

const formatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(undefined, { timeZone: "UTC", ...options });

const formatDays = (count: number) =>
  new Intl.NumberFormat(undefined, { style: "unit", unit: "day", unitDisplay: "long" }).format(
    count,
  );

export const unitEnd = (value: string): Date => {
  const date = new Date(value);

  switch (precisionOf(value)) {
    case "year":
      return new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1));
    case "month":
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    default:
      return new Date(date.getTime() + DAY_MS);
  }
};

const isOngoing = (value: string) => unitEnd(value).getTime() > Date.now();

const formatSingle = (value: string) =>
  formatter(optionsFor(precisionOf(value))).format(new Date(value));

const formatSpan = (start: string, end: string) =>
  formatter(optionsFor(coarser(precisionOf(start), precisionOf(end)))).formatRange(
    new Date(start),
    new Date(end),
  );

export const formatVisit = (start: string, end?: string): string => {
  if (!end) {
    return formatSingle(start);
  }

  if (isOngoing(end)) {
    return `${formatSingle(start)} - now`;
  }

  let label = formatSpan(start, end);
  if (precisionOf(start) === "day" && precisionOf(end) === "day") {
    const days = Math.round((unitEnd(end).getTime() - new Date(start).getTime()) / DAY_MS);
    if (days <= 45) {
      label += ` · ${formatDays(days)}`;
    }
  }

  return label;
};

export const summarizeDates = (dates: [string, string?][]): DateSummary | null => {
  if (!dates.length) {
    return null;
  }

  const intervals = dates.map(([start, end]) => ({
    start: new Date(start).getTime(),
    end: (end ? unitEnd(end) : unitEnd(start)).getTime(),
  }));

  const start = Math.min(...intervals.map((i) => i.start));
  const end = Math.max(...intervals.map((i) => i.end));
  const span = end - start;

  const spanDays = span / DAY_MS;
  const unit: Precision = spanDays <= 45 ? "day" : spanDays <= 3 * 366 ? "month" : "year";

  const firstStart = dates.map(([s]) => s).reduce((a, b) => (new Date(b) < new Date(a) ? b : a));
  const lastEnd = dates.map(([s, e]) => e ?? s).reduce((a, b) => (unitEnd(b) > unitEnd(a) ? b : a));
  const ongoing = isOngoing(lastEnd);
  const axis = formatter(optionsFor(unit));

  let header: string;
  if (dates.length === 1) {
    header = formatVisit(dates[0][0], dates[0][1]);
  } else {
    const stays = dates.some(
      ([s, e]) => e && unitEnd(e).getTime() - new Date(s).getTime() > 60 * DAY_MS,
    );
    const range = ongoing
      ? `${axis.format(new Date(firstStart))} - now`
      : axis.formatRange(new Date(firstStart), new Date(lastEnd));

    header = `${dates.length} ${stays ? "stays" : "visits"} · ${range}`;
  }

  const pad = span * 0.05;
  const domainStart = start - pad;
  const domainSpan = span + 2 * pad;

  const segments = dates.map(([start, end], index) => ({
    label: formatVisit(start, end),
    left: (intervals[index].start - domainStart) / domainSpan,
    width: (intervals[index].end - intervals[index].start) / domainSpan,
  }));

  return {
    end: domainStart + domainSpan,
    endLabel: ongoing ? "now" : axis.format(new Date(lastEnd)),
    header,
    segments,
    start: domainStart,
    startLabel: axis.format(new Date(firstStart)),
  };
};

export type Visit = {
  color: string;
  end: number;
  label: string;
  name: string;
  point: Point;
  start: number;
  year: number;
};

export const flattenVisits = (entries: Iterable<[string, Point]>): Visit[] => {
  const visits: Visit[] = [];

  for (const [name, point] of entries) {
    for (const [start, end] of point.dates ?? []) {
      visits.push({
        color: getColor(point.dates ?? []),
        end: (end ? unitEnd(end) : unitEnd(start)).getTime(),
        label: formatVisit(start, end),
        name,
        point,
        start: new Date(start).getTime(),
        year: new Date(start).getUTCFullYear(),
      });
    }
  }

  return visits.sort((a, b) => a.start - b.start || a.end - b.end);
};
