#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "week3_fastapi/requirements.txt" ]; then
    pip install -r week3_fastapi/requirements.txt
fi

cd week4_react
npm install
npm run build
cd ..
