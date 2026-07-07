#!/bin/bash

skip_exif_strip=false
for arg in "$@"; do
  [ "$arg" = "--skip-exif-strip" ] && skip_exif_strip=true
done

cd ./public/images

if [ "$skip_exif_strip" = false ]; then
  exiftool -q -overwrite_original -r -all= --icc_profile:all -tagsFromFile @ -Orientation -DateTimeOriginal .
fi

find . -type d -exec bash -c '[ ! -d "../thumbnails/${0:2}" ] && echo "creating ${0}" && mkdir "../thumbnails/${0:2}"' {} \;
find . -type f \( ! -iname ".*" \) -exec bash -c 'base="${0:2}"; webp="../thumbnails/${base%.*}.webp"; [ ! -f "$webp" ] && echo "converting ${0}" && magick "$0" -resize 600 "$webp" && exiftool -q -overwrite_original -all= --icc_profile:all -tagsFromFile "$0" -Orientation -DateTimeOriginal "$webp"' {} \;

cd ../thumbnails
find . -type d -exec bash -c '[ ! -d "../images/${0:2}" ] && echo "removing ${0}" && rm -r "${0}"' {} \;
find . -type f \( ! -iname ".*" \) -exec bash -c 'base="${0:2}"; basename="${base%.*}"; [ ! -f "../images/${basename}."* ] && echo "removing ${0}" && rm "${0}"' {} \;
