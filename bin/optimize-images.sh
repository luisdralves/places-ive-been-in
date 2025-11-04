#!/bin/bash

cd ./public/images
find . -type d -exec bash -c '[ ! -d "../thumbnails/${0:2}" ] && echo "creating ${0}" && mkdir "../thumbnails/${0:2}"' {} \;
find . -type f \( ! -iname ".*" \) -exec bash -c 'base="${0:2}"; [ ! -f "../thumbnails/${base}" ] && echo "converting ${0}" && magick "$0" -resize 600 "../thumbnails/${base%.*}.webp"' {} \;

cd ../thumbnails
find . -type d -exec bash -c '[ ! -d "../images/${0:2}" ] && echo "removing ${0}" && rm -r "${0}"' {} \;
find . -type f \( ! -iname ".*" \) -exec bash -c 'base="${0:2}"; basename="${base%.*}"; [ ! -f "../images/${basename}."* ] && echo "removing ${0}" && rm "${0}"' {} \;
