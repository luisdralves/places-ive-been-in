import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const imagesRoot = path.resolve("./public/images");

const cityNames = readdirSync(imagesRoot, { withFileTypes: true })
  .filter((item) => item.isDirectory())
  .map(({ name }) => name);

// The capture time is treated as UTC so markers line up with the UTC day-precision visit dates.
const dateByPath = new Map(
  execFileSync(
    "exiftool",
    [
      "-r",
      "-q",
      "-d",
      "%Y-%m-%dT%H:%M:%SZ",
      "-if",
      "$datetimeoriginal",
      "-p",
      "$directory/$filename\t$datetimeoriginal",
      imagesRoot,
    ],
    { encoding: "utf-8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [file, date] = line.split("\t");

      return [path.resolve(file), date];
    }),
);

const citiesWithPics = Object.fromEntries(
  cityNames.map((cityName) => [
    cityName,
    readdirSync(path.join(imagesRoot, cityName), { withFileTypes: true })
      .filter((item) => !item.isDirectory() && item.name !== ".directory")
      .map(({ name }) => {
        const date = dateByPath.get(path.join(imagesRoot, cityName, name));

        return {
          thumbnail: name.replace(/\.\w+$/i, ".webp"),
          original: name,
          ...(date && { date }),
        };
      })
      .sort((a, b) => {
        if (a.date && b.date) return a.date.localeCompare(b.date);
        if (a.date) return -1;
        if (b.date) return 1;

        return a.original.localeCompare(b.original);
      }),
  ]),
);

writeFileSync(
  path.resolve("./src/core/config/image-paths.json"),
  JSON.stringify(citiesWithPics, null, 2),
  { encoding: "utf-8" },
);
