# Sparkle Bows

This repository contains both parts of the Sparkle Bows application.

```text
client/   React storefront
server/   Express API
```

## Local development

Install dependencies separately for each application:

```bash
npm ci --prefix client
npm ci --prefix server
```

Run the API with `npm run server:dev` and the storefront with `npm run client`.

The server environment variables belong in `server/.env`; the client uses `client/.env` for any `REACT_APP_*` variables.
