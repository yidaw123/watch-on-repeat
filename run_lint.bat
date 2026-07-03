@echo off
set PATH=%CD%\node-v20.11.1-win-x64;%PATH%
npm config set strict-ssl false
npm install
npm run lint > lint_output.txt 2>&1
