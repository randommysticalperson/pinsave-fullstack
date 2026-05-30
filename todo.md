# PinSave NFT Pinboard — TODO

## Backend / Infrastructure
- [x] Add server-side environment variables: NFT_STORAGE_API_KEY, NEAR_CONTRACT_NAME, NEAR_NETWORK_ID
- [x] Create .env.example documenting all required environment variables
- [x] Build secure /api/upload endpoint that proxies image files to NFT.Storage server-side
- [x] Build /api/near-config endpoint that returns safe (non-secret) NEAR config to the frontend
- [x] Add tRPC procedure: pins.list — fetch all NFT tokens from NEAR contract
- [x] Add tRPC procedure: pins.byOwner — fetch tokens owned by a given accountId
- [x] Add tRPC procedure: pins.byId — fetch a single token by token_id
- [x] Install near-api-js on server for contract view calls

## Frontend — Design System & Layout
- [x] Design tokens: dark/light palette, typography, spacing, radius in index.css
- [x] Top navigation bar with logo, Home/Upload/Saved links, and wallet connect/disconnect button
- [x] Responsive mobile-first layout wrapper
- [x] Loading skeleton components for masonry cards
- [x] Toast notifications for wallet and upload actions

## Frontend — NEAR Wallet
- [x] NEAR wallet context (NearContext) providing wallet, contract, currentUser, nearConfig
- [x] Wallet connect flow using near-api-js BrowserLocalStorageKeyStore + WalletConnection
- [x] Wallet disconnect flow
- [x] Wallet status indicator in nav (account ID + balance badge)
- [x] Environment-driven NEAR network config fetched from /api/near-config

## Frontend — Pages
- [x] Home page: Pinterest-style masonry grid of all NFT pins
- [x] Upload page: image picker, title/description form, mint NFT via NEAR contract
- [x] Saved/Profile page: masonry grid of pins owned by connected wallet
- [x] Pin Detail page: full image, metadata (title, description, owner, IPFS CID), NEAR explorer link
- [x] 404 / Not Found page

## Polish & Quality
- [x] Smooth hover/focus animations on pin cards
- [x] Responsive masonry layout (CSS columns or JS masonry)
- [x] Empty state illustrations for no pins / not connected
- [x] Mobile navigation drawer
- [x] Vitest unit tests for backend procedures and upload endpoint

## Settings Page (In-App Configuration)
- [x] DB table: app_config (key VARCHAR, value TEXT, updatedAt TIMESTAMP)
- [x] tRPC procedure: config.get — return current NFT_STORAGE_API_KEY (masked), NEAR_CONTRACT_NAME, NEAR_NETWORK_ID from DB
- [x] tRPC procedure: config.save (admin/owner only) — upsert config values into DB
- [x] Settings page UI: form with NFT.Storage API key input (masked), contract name, network selector
- [x] Server reads config from DB at runtime, falling back to process.env defaults
- [x] Show success/error toast on save
