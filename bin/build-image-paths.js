import { readdirSync, writeFileSync } from 'fs';
import path from 'path';

const cityNames = readdirSync(path.resolve('./public/images'), {
  withFileTypes: true
})
  .filter(item => item.isDirectory())
  .map(({ name }) => name);

const citiesWithPics = cityNames.reduce(
  (citiesWithPics, cityName) => ({
    ...citiesWithPics,
    [cityName]: readdirSync(path.join('./public/images', cityName), {
      withFileTypes: true
    })
      .filter(item => !item.isDirectory() && item.name !== '.directory')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name }) => ({
        thumbnail: name.replace(/\.\w+$/i, '.webp'),
        original: name
      }))
  }),
  {}
);

writeFileSync(
  path.resolve('./src/core/config/image-paths.json'),
  JSON.stringify(citiesWithPics, null, 2),
  { encoding: 'utf-8' }
);
