rm -r ./public/thumbnails
cd ./public/images
find . -type d -exec sh -c 'mkdir "../thumbnails/${0:2}"' {} \;
find . -type f \( ! -iname ".*" \) -exec sh -c 'convert -resize 600 "$0" "../thumbnails/${0:2}"' {} \;
