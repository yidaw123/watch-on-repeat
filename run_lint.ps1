$env:PATH = "$((Get-Location).Path)\node-v20.11.1-win-x64;$env:PATH"
npm config set strict-ssl false
npm install 2>&1 | Out-File -FilePath npm_install.txt
npm run lint 2>&1 | Out-File -FilePath lint_output.txt
