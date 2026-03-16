@echo off
set "NODE_DIR=C:\Users\stjia\AppData\Local\Logi\LogiPluginService\PluginHosts\node22\node"
set "PATH=%NODE_DIR%;%NODE_DIR%\node_modules\.bin;%PATH%"

cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call "%NODE_DIR%\npm.cmd" install
)
echo Starting dev server...
call "%NODE_DIR%\npx.cmd" vite --port 5173
