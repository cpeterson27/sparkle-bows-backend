# Sparkle Bows

Sparkle Bows is a production ecommerce storefront for boutique hair accessories. It includes a customer-facing React storefront, a separate Node/Express backend, Stripe-powered checkout, admin operations tooling, Shippo label purchasing, Klaviyo VIP capture, editable SEO settings, and GA4/GTM-ready analytics.

## Overview

This project powers:

- A polished storefront for browsing, cart management, checkout, account management, and order history
- An admin dashboard for product management, orders, analytics, finance visibility, and site settings
- A secure backend API for authentication, products, carts, checkout, orders, reviews, leads, and operations
- Marketing and operational integrations for analytics, email, VIP list growth, taxes, shipping, and fulfillment

## Live Architecture

- Frontend: React 19, Create React App, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Payments: Stripe Payment Intents, Stripe Tax, Stripe webhooks, Stripe Elements
- Shipping: Shippo shipment creation and label purchasing
- Media: Cloudinary
- Email: Resend, Nodemailer, SendGrid-compatible support in the backend mail layer
- Marketing: Google Analytics 4, Google Tag Manager support, Klaviyo VIP list integration
- Security: JWT auth, refresh tokens in cookies, Helmet, CORS, rate limiting, Mongo sanitization, 2FA support

## Core Features

- Product catalog with categories, collections, reviews, and inventory
- Persistent cart for guests and signed-in users
- Stripe checkout with tax calculation based on shipping destination
- Customer accounts with profile management, saved addresses, and order history
- Google OAuth login and email/password authentication
- Optional two-factor authentication and recovery codes
- Admin dashboard with:
  - Product creation and editing
  - Order management
  - Tracking updates
  - Shippo label purchasing
  - Sales analytics and finance views
  - Editable SEO defaults and analytics settings
- Product SEO fields and JSON-LD structured data
- GA4 ecommerce events:
  - `page_view`
  - `view_item`
  - `add_to_cart`
  - `remove_from_cart`
  - `begin_checkout`
  - `purchase`
  - `login`
  - `sign_up`
  - `generate_lead`
- Legal policy pages for privacy, terms, refunds, and shipping
- VIP signup flow connected to Klaviyo
- Contact form with operational email delivery

## Tech Stack

### Frontend

- React 19
- React DOM 19
- React Router DOM 6
- Axios
- Tailwind CSS
- PostCSS
- Autoprefixer
- Lucide React
- Recharts
- React Dropzone
- TanStack React Query
- DnD Kit
- Stripe.js and React Stripe.js

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- cookie-parser
- Helmet
- express-rate-limit
- express-mongo-sanitize
- Joi
- Morgan
- Winston
- Multer
- Cloudinary
- Stripe
- Nodemailer
- Resend
- SendGrid Mail
- node-fetch

## Services and Platforms Used

- Stripe for checkout, payment processing, taxes, and webhook fulfillment
- Shippo for shipping label creation and tracking
- Cloudinary for product image hosting and uploads
- Klaviyo for VIP list growth and event tracking
- Google Analytics 4 for traffic and ecommerce analytics
- Google Tag Manager support for future marketing expansion
- Google Maps API for address validation support
- MongoDB for primary application data
- Render-style deployment workflow for frontend and backend hosting
- Wave integration code exists in the backend service layer for accounting-related workflows

## Repository Structure

This repository is the frontend application.

Key frontend areas:

- `src/App.jsx`: top-level routing and shared UI orchestration
- `src/components/`: storefront, checkout, admin, analytics, and modal components
- `src/pages/`: route-level pages including storefront, collections, product, account, and policy pages
- `src/context/`: authentication and site settings context
- `src/lib/`: analytics and shared frontend helpers
- `src/api/`: Axios configuration and API wrappers

The backend lives separately and powers the API consumed by this frontend.

Key backend areas:

- `routes/`: auth, products, cart, Stripe, orders, reviews, leads, admin, contact, checkout
- `models/`: users, orders, products, carts, expenses, leads, refresh tokens, site settings
- `services/`: Shippo, email, Wave-related code
- `middleware/`: auth, rate limiting, logging
- `utils/`: shipping logic and form protection helpers

## SEO and Analytics

Sparkle Bows includes:

- Editable site-wide SEO defaults in admin
- Product-level SEO title, description, and keywords
- Structured data for products and pages
- Open Graph and Twitter metadata
- Canonical URLs
- GA4 measurement ID support
- GTM container support
- Ecommerce event tracking across the shopping funnel

## Shipping and Operations

- Customer-facing shipping is currently rule-based at checkout
- Shippo is used operationally to purchase labels and save tracking data to orders
- Actual label cost is stored on the order for cleaner profit reporting
- Admin users can update order status, add tracking, and buy shipping labels

## Authentication and Security

- Email/password login
- Google OAuth login
- JWT access tokens
- Refresh-token cookie flow
- Two-factor authentication support
- Rate limiting on auth, contact, cart, and leads routes
- Helmet security headers
- CORS allow-listing
- Mongo sanitization
- Honeypot and timing-based form protection on public submissions

## Environment Variables

### Frontend

Common frontend environment variables:

- `REACT_APP_API_URL`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- `REACT_APP_GOOGLE_OAUTH_ENABLED`

### Backend

Core backend environment variables used by the application include:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `FRONTEND_CUSTOM_DOMAIN`
- `OWNER_EMAIL`

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_TAX_PREVIEW_VERSION`
- `STRIPE_DEFAULT_PRODUCT_TAX_CODE`
- `STRIPE_DEFAULT_SHIPPING_TAX_CODE`
- `STRIPE_SHIP_FROM_COUNTRY`
- `STRIPE_SHIP_FROM_LINE1`
- `STRIPE_SHIP_FROM_LINE2`
- `STRIPE_SHIP_FROM_CITY`
- `STRIPE_SHIP_FROM_STATE`
- `STRIPE_SHIP_FROM_POSTAL_CODE`

Google OAuth and validation:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_MAPS_API_KEY`

Cloudinary:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Shippo:

- `SHIPPO_API_TOKEN`
- `SHIPPO_FROM_NAME`
- `SHIPPO_FROM_COMPANY`
- `SHIPPO_FROM_LINE1`
- `SHIPPO_FROM_LINE2`
- `SHIPPO_FROM_CITY`
- `SHIPPO_FROM_STATE`
- `SHIPPO_FROM_ZIP`
- `SHIPPO_FROM_COUNTRY`
- `SHIPPO_FROM_PHONE`
- `SHIPPO_FROM_EMAIL`
- `SHIPPO_BASE_WEIGHT_OZ`
- `SHIPPO_PER_ITEM_WEIGHT_OZ`
- `SHIPPO_PARCEL_LENGTH_IN`
- `SHIPPO_PARCEL_WIDTH_IN`
- `SHIPPO_PARCEL_HEIGHT_IN`

Klaviyo:

- `KLAVIYO_PRIVATE_KEY`

Optional email/provider configuration may also exist depending on how the backend mail service is deployed.

## Local Development

### Frontend

```bash
npm install
npm start
```

### Frontend build

```bash
npm run build
```

### Backend

From the backend repository:

```bash
npm install
npm run dev
```

## Available Scripts

Frontend scripts:

- `npm start`: run the React app in development
- `npm run build`: create a production build
- `npm test`: run the frontend test runner

Backend scripts:

- `npm start`: run the Node server
- `npm run dev`: run the backend with nodemon
- `npm test`: run backend Jest tests
- `npm run seed`: seed application data
- `npm run create-admin`: create an admin user

## Project Status

This storefront is configured as a production ecommerce application with real checkout, taxes, admin tooling, policy pages, analytics support, and shipping operations. It is designed to support live sales of handmade bows with a more professional operational baseline than a typical starter template.

## Notes

- This README documents both the frontend application and the connected backend stack because the storefront depends on both
- Some integrations are optional by environment and only activate when their related keys are configured
- Before public launch, policy text and environment values should always be reviewed against the live business setup
