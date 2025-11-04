import { readdirSync, writeFileSync } from 'fs';
import path from 'path';

const cityNames = readdirSync(path.resolve('./public/thumbnails'), {
  withFileTypes: true
})
  .filter(item => item.isDirectory())
  .map(({ name }) => name);

// Helper to find original file with any extension
const findOriginalFile = (cityName, thumbnailName) => {
  const baseName = thumbnailName.replace(/\.webp$/i, '');
  const imagesDir = path.join('./public/images', cityName);
  const imagesFiles = readdirSync(imagesDir);

  const originalFile = imagesFiles.find(file => {
    const fileBaseName = file.replace(/\.[^.]+$/, '');
    return fileBaseName === baseName;
  });

  return originalFile || thumbnailName;
};

const citiesWithPics = cityNames.reduce(
  (citiesWithPics, cityName) => ({
    ...citiesWithPics,
    [cityName]: readdirSync(path.join('./public/thumbnails', cityName), {
      withFileTypes: true
    })
      .filter(item => !item.isDirectory() && item.name !== '.directory')
      .map(({ name }) => ({
        thumbnail: name,
        original: findOriginalFile(cityName, name)
      }))
  }),
  {}
);

writeFileSync(
  path.resolve('./src/core/config/image-paths.json'),
  JSON.stringify(citiesWithPics, null, 2),
  { encoding: 'utf-8' }
);
