@echo off
set PATH=%CD%\node-v20.11.1-win-x64;%PATH%
npm run lint > lint2.txt 2>&1
