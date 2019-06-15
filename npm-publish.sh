#! /bin/bash

rm -rf lib
npm run build
if test -n "$1"
then
    npm version "$1"
fi
if test -n "$2"
then
    repo=`npm get repository`
    npm set repository "$2"
    npm publish
    npm set repository "$repo"
else
    npm publish
fi
