# Atlas Terminal desktop client

`npm run tauri:dev` starts the Next.js app on port 3001 and opens the native
Tauri shell. Production builds load the deployed Atlas URL, set through the
`ATLAS_DESKTOP_URL` runtime environment variable; they do not copy API keys or
market-data credentials into the desktop bundle.
