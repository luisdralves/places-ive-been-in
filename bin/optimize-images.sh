#!/bin/bash

cd ./public/images
find . -type d -exec bash -c '[ ! -d "../thumbnails/${0:2}" ] && echo "creating ${0}" && mkdir "../thumbnails/${0:2}"' {} \;
find . -type f \( ! -iname ".*" \) -exec bash -c '[ ! -f "../thumbnails/${0:2}" ] && echo "converting ${0}" && convert -resize 600 "$0" "../thumbnails/${0:2}"' {} \;

cd ../thumbnails
find . -type d -exec bash -c '[ ! -d "../images/${0:2}" ] && echo "removing ${0}" && rm -r "${0}"' {} \;
find . -type f \( ! -iname ".*" \) -exec bash -c '[ ! -f "../images/${0:2}" ] && echo "removing ${0}" && rm "${0}"' {} \;
