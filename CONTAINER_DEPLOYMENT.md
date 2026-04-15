# Container Deployment

This backend can be deployed as a single Node container.

## 1. Build the image

```bash
docker build -t sparkle-bows-backend .
```

## 2. Run the container

```bash
docker run --env-file .env -p 3001:3001 sparkle-bows-backend
```

## 3. Required environment variables

At minimum, set these before starting the container:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=https://your-frontend-domain
FRONTEND_CUSTOM_DOMAIN=https://www.sparklebows.shop
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 4. Optional environment variables

Only set these if your deployment uses the related integrations:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
GMAIL_USER=
GMAIL_PASS=
GMAIL_APP_PASSWORD=
GOOGLE_MAPS_API_KEY=
KLAVIYO_PRIVATE_KEY=
OWNER_EMAIL=
SHIPPO_API_TOKEN=
SHIPPO_FROM_NAME=
SHIPPO_FROM_COMPANY=
SHIPPO_FROM_EMAIL=
SHIPPO_FROM_PHONE=
SHIPPO_FROM_LINE1=
SHIPPO_FROM_LINE2=
SHIPPO_FROM_CITY=
SHIPPO_FROM_STATE=
SHIPPO_FROM_ZIP=
SHIPPO_FROM_COUNTRY=
STRIPE_DEFAULT_PRODUCT_TAX_CODE=
STRIPE_DEFAULT_SHIPPING_TAX_CODE=
STRIPE_SHIP_FROM_LINE1=
STRIPE_SHIP_FROM_LINE2=
STRIPE_SHIP_FROM_CITY=
STRIPE_SHIP_FROM_STATE=
STRIPE_SHIP_FROM_POSTAL_CODE=
STRIPE_SHIP_FROM_COUNTRY=
STRIPE_TAX_PREVIEW_VERSION=
WAVE_API_TOKEN=
WAVE_BUSINESS_ID=
LOG_LEVEL=info
```

## 5. Notes for production

- The container uses `npm start`, which runs `server.js`.
- `PORT` defaults to `3001` inside the container.
- HTTPS files are optional. If `SSL_KEY_PATH` and `SSL_CERT_PATH` are not set, the app runs in HTTP mode, which is normal behind a platform proxy or load balancer.
- The app writes logs to `logs/error.log` and `logs/combined.log` in the container filesystem. Console logs will still appear in platform logs.

## 6. Example for a hosted container platform

If a platform asks for a start command, use:

```bash
npm start
```

If it asks for a Docker entrypoint, this repository now includes a `Dockerfile`, so pointing the platform at the repo root is enough.
