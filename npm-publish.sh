#! /bin/bash

rm -rf lib
npm run build
if test -n "$1"
then
    npm version "$1"
fi
npm publish
