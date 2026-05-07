# Dailyzo Customer App

React Native (Expo) — the customer-facing grocery shopping app.

## Features

- 📱 **Phone + OTP login** (mock OTP `123456` works against the seeded backend)
- 🏠 **Home** with delivery banner, search, banner promo, category grid, bestsellers, featured
- 🗂️ **Categories** screen and **Category Products** filtered list
- 🔍 **Search** with full-text product search
- 🛒 **Product detail** with add-to-cart, qty stepper, ratings
- 🧺 **Cart** with itemised bill, free-delivery threshold, savings calc
- 📍 **Address book** (add new addresses with label/Home/Work/Other)
- 💳 **Checkout** — COD, UPI, Razorpay, Wallet (mock for non-COD; real flow with API keys)
- 🎟️ **Coupon validation** at checkout
- 📦 **Orders** list with status pills
- 🚴 **Live order tracking** — status timeline + map with rider's GPS via Socket.io
- 👤 **Account** with addresses, wallet, support links

## Setup

```bash
cd mobile-app
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (iOS/Android).

### Connecting to your backend

The mobile app auto-resolves the API URL based on platform:

- **iOS Simulator**: `http://localhost:5000`
- **Android Emulator**: `http://10.0.2.2:5000`
- **Physical device (Expo Go)**: open `app.json` and change `extra.API_URL` to your laptop's LAN IP, e.g. `http://192.168.1.5:5000`

### Login

- Phone: any 10-digit number (e.g. `7275924625`)
- OTP: **`123456`**

## Tech

- Expo SDK 51, React Native 0.74
- React Navigation (native stack + bottom tabs)
- Zustand for state (auth + cart)
- Axios + Socket.io client
- `react-native-maps` for live tracking
- `expo-location` (used by delivery app in Phase 3)
- `expo-linear-gradient` for hero banners
