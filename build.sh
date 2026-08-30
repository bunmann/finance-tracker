#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r week3_fastapi/requirements.txt

cd week4_react
npm install
npm run build
cd ..
