import imagePaths from "src/core/config/image-paths.json";
import { points } from "src/core/config/points";
import { unitEnd } from "src/core/utils/dates";

const images = imagePaths as Record<
  string,
  { thumbnail: string; original: string; date?: string }[]
>;

const windowOf = ([start, end]: [string, string?]): [number, number] => [
  new Date(start).getTime(),
  unitEnd(end ?? start).getTime(),
];

const warnings: string[] = [];
let checked = 0;

for (const [place, imgs] of Object.entries(images)) {
  if (!imgs.length) continue;

  const point = points.get(place);
  if (!point) {
    warnings.push(`${place}: has ${imgs.length} photos but is absent from points.ts`);
    continue;
  }

  const windows = (point.dates ?? []).map(windowOf);

  for (const img of imgs) {
    checked++;

    if (!img.date) {
      warnings.push(`${place}/${img.original}: missing DateTimeOriginal`);
      continue;
    }

    if (!windows.length) {
      warnings.push(`${place}/${img.original} (${img.date}): place has no dates in points.ts`);
      continue;
    }

    const t = new Date(img.date).getTime();
    if (!windows.some(([a, b]) => t >= a && t < b)) {
      warnings.push(
        `${place}/${img.original}: ${img.date} outside visits ${JSON.stringify(point.dates)}`,
      );
    }
  }
}

if (warnings.length) {
  console.warn(`\n⚠ image-date check: ${warnings.length} warning(s) across ${checked} photos`);
  for (const w of warnings.sort()) console.warn(`  ${w}`);
  console.warn("");
} else {
  console.log(`✓ image-date check: ${checked} photos all dated and within their visit windows`);
}
