# Dailyzo Rider App

React Native (Expo) — the delivery partner app.

## Features

- 🔒 Phone + password login (delivery role only — refuses non-rider accounts)
- 🟢 **On-duty switch** — toggles availability on the backend so admins can assign you orders
- 📊 **Home dashboard** with total deliveries, lifetime earnings, rating, vehicle info
- 📍 **Active order screen** with live map, distance to drop, customer call button, drop-pin, "open in Google/Apple Maps" navigate button, status progression buttons
- 🛰️ **Live GPS streaming** via `expo-location` — watches position every 15 m and emits to the backend over Socket.io (`partner:location`), so customers and admin see your bike move on their map
- 🔔 In-app push toast when a new order is assigned (via socket event `order:assigned`)
- 📜 **History & earnings** screen with today / this-week stats and per-order earned breakdown
- 👤 Profile with vehicle details and performance stats

## Setup

```bash
cd delivery-app
npm install
npx expo start
```

Then scan the QR code with **Expo Go** on your phone, or press `i` / `a` for simulators.

### Demo credentials (from seed data)

| Phone | Password |
|---|---|
| `9111100001` | `pass1234` |
| `9111100002` | `pass1234` |

### Connecting to your backend

Same rules as the customer app:

- iOS Simulator → `http://localhost:5000`
- Android Emulator → `http://10.0.2.2:5000`
- Physical device → set `extra.API_URL` in `app.json` to your laptop's LAN IP

### Permissions

The app will ask for **location while in use** to share GPS with customers. On Android we also include the `ACCESS_BACKGROUND_LOCATION` and `FOREGROUND_SERVICE` permissions in `app.json` for future background tracking via `expo-task-manager`.

## How it ties together

```
Rider opens active order
     ↓
useLiveLocation hook starts watchPositionAsync (every 15m / 5s)
     ↓
On each update:
  socket.emit('partner:location', { lat, lng, orderId })
  POST /api/delivery/me/location  (every 15s as fallback)
     ↓
Backend forwards via Socket.io rooms:
  → order:{id}    (customer's tracking screen)
  → admin        (admin Live Map page)
```
