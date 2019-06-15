#! /bin/bash

npm run doc
git push
if test -n "$1"
then
    git tag -a "$1" -m "Version $1"
    git push --tags
fi
