# places-ive-been-in

A react app to keep track of places I've been in

<img width="2400" height="1600" alt="places-ive-been-in luisdralves dev__place=Amsterdam" src="https://github.com/user-attachments/assets/3107e552-aab2-44aa-92a4-281141ba176f" />

### Usage

1. Create `src/core/config/points.ts` and add some points, as such:

```ts
import { Points } from 'types/point';

export const points: Points = new Map([
  [
    'Viana do Castelo',
    {
      dates: [
        ['1996-08-10', '2014-09'],
        ['2020-04-04', '2026-01-01']
      ],
      lat: 41.70202218723603,
      lon: -8.834946931369325,
    }
  ]
];
```

2. Add images to subfolders in `public/images` matching the names of the points
3. Generate image thumbnails and paths

```sh
bun install
bun optimize-images
bun build-image-paths
bun check-dates
```

4. Run the app

```sh
bun dev
```
