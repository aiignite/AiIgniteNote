@echo off
set NODE_OPTIONS=--max-old-space-size=8192
cd packages/frontend
call pnpm build
