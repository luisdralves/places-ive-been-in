# places-ive-been-in

A react app to keep track of places I've been in

![Preview](https://github.com/luisdralves/places-ive-been-in/assets/22676183/ac9a571b-d270-4db5-a765-a650de35eace)

### Usage

1. Create `src/core/config/points.ts` and add some points, as such:

```ts
import { Point } from "types/point";

const today = new Date().toISOString().slice(0, 10);

export const points: Point[] = [
  {
    dates: [
      ['1996-08-10', '2019-10-10'],
      ['2022-04-04', today]
    ],
    lat: 41.67282209030566,
    lon: -8.77587141795533,
    name: 'Viana do Castelo'
  }
];
```

2. Add images to subfolders in `public/images` matching the names of the points
3. Generate image thumbnails and paths

```sh
yarn
yarn optimize-images
yarn build-image-paths
```

4. Run the app

```sh
yarn dev
```
