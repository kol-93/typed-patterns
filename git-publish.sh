#! /bin/bash

npm run doc
touch docs/.nojekyll
touch docs/modules/.nojekyll
git add docs
git commit -m 'docs'

git push
if test -n "$1"
then
    git tag -a "$1" -m "Version $1"
    git push --tags
fi
