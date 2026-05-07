# Dailyzo — End-to-end Grocery Delivery Platform

A complete, production-ready Blinkit/BigBasket-style 10-minute grocery startup.

| Surface | Stack |
|---|---|
| **Backend API** (`backend/`) | Node.js · Express · MongoDB (Mongoose) · Socket.io · JWT · Razorpay |
| **Admin Web** (`admin-web/`) | React 18 · Vite · TailwindCSS · Recharts · Leaflet · Zustand |
| **Customer App** (`mobile-app/`) | React Native (Expo) · React Navigation · `react-native-maps` · Zustand |
| **Rider App** (`delivery-app/`) | React Native (Expo) · `expo-location` · Socket.io · live GPS streaming |

---

## ✅ Everything that ships

### Backend
- Auth (JWT + refresh) for customer / delivery / admin
- Mock OTP login (works without any SMS provider)
- 9 Mongoose models with proper indexes, including a 2dsphere geo index on rider locations
- 40+ REST endpoints
- Real-time Socket.io rooms (`order:{id}`, `user:{id}`, `admin`)
- **Razorpay SDK integration** with auto-fallback to mock mode if no keys
- File uploads via Multer
- Coupons (flat / percent / min-order / max-cap / usage limits)
- Synthetic seed: admin, ~30 grocery products, 3 customers, 2 riders, 3 coupons, **30 days of orders** for chart data

### Admin Web (every screen real)
- Login + protected routes
- **Dashboard** with KPIs (today/week/month/lifetime revenue + orders), revenue area chart, status pie chart, top products, low-stock alerts
- **Orders** list with status filter chips (live counts), search, real-time refresh on socket events
- **Order side-drawer** with timeline, items, customer info, address, status update buttons, **assign delivery partner picker**, cancel
- **Inventory** with stock chips, ±1 adjusters, bulk-set
- **Categories** card grid CRUD
- **Products** searchable table CRUD with modal form
- **Delivery Partners** CRUD with vehicle, rating, earnings, availability
- **Live Map** (Leaflet + OpenStreetMap) showing every rider with real-time GPS via Socket.io
- **Customers** searchable list
- **Coupons** CRUD with all options
- **Transactions** filterable by method/status

### Customer App
- Phone OTP login (mock OTP `123456`)
- Home with delivery banner, search, gradient hero promo, category grid, bestsellers, featured rows
- Categories grid + category products list
- Search with full-text
- Product detail with discount tag, qty stepper, info row
- Cart with savings calc, free-delivery threshold, sticky footer
- Address book (Home/Work/Other)
- Checkout: address picker, **coupon validation**, 4 payment methods (COD/UPI/Razorpay/Wallet), bill summary
- Orders list with bbnow-style cards, status pills
- **Live Order Tracking** with map, rider GPS marker + drop pin + polyline route, animated 6-step timeline, partner card, cancel button — all updating in real-time via Socket.io
- Account screen with stats, menu, logout

### Rider App
- Phone + password login (delivery role only)
- **On-duty switch** — toggles availability so admins can assign you orders
- Home dashboard with deliveries, earnings, rating, vehicle
- **Active order screen** — live map, distance to drop, customer call button, "open in Apple/Google Maps" navigate, status progression buttons (Picked up → Delivered)
- 🛰️ **Live GPS streaming** via `expo-location` — emits `partner:location` over Socket.io every 15m, REST fallback every 15s
- Real-time `order:assigned` push toast when admin assigns you a new order
- History screen with today/week stats, lifetime earnings, per-order earned breakdown
- Profile with vehicle, performance, support, logout

---

## 📋 Prerequisites

1. **Node.js 18+**
2. **MongoDB running locally** (`mongodb://127.0.0.1:27017`)
   - macOS: `brew install mongodb-community && brew services start mongodb-community`
   - Or Docker: `docker run -d -p 27017:27017 --name dailyzo-mongo mongo:7`

---

## 🚀 Run everything (4 terminals)

```bash
# 0. Make sure MongoDB is up
brew services start mongodb-community

# 1. Backend (one-time setup, then run)
cd backend
cp .env.example .env
npm install
npm run seed       # creates admin, products, sample orders
npm run dev        # http://localhost:5000

# 2. Admin web
cd ../admin-web && npm install && npm run dev   # http://localhost:5173

# 3. Customer app
cd ../mobile-app && npm install && npx expo start

# 4. Rider app
cd ../delivery-app && npm install && npx expo start
```

### Login credentials (from seed)

| App | Login | Password / OTP |
|---|---|---|
| Admin web | `admin@dailyzo.com` | `admin@123` |
| Customer app | any 10-digit phone | OTP `123456` |
| Rider app | `9111100001` or `9111100002` | `pass1234` |

---

## 🔌 The data flow

```
Customer app                     Backend                      Rider app                  Admin web
─────────────                    ───────                      ──────────                 ─────────
Place order  ───────────▶  POST /orders/checkout
                           ▶ saves Order
                           ▶ emit('order:new', admin)  ───────────────────────────────▶  toast + refetch
                                                                                          assign rider 
                           ◀ POST /orders/:id/assign  ──────────────────────────────────  click rider in drawer
                           ▶ emit('order:assigned', user:{rider})  ─────▶ in-app alert
                           ▶ emit('order:status', order:{id})
Track Order  ──────────────▶ socket.emit('order:subscribe')
                           ◀ joins order:{id} room

                                                       expo-location watchPosition
                                                       socket.emit('partner:location', { lat, lng, orderId })
                           ▶ saves to DeliveryPartner
                           ▶ emit('partner:location', order:{id})  ──▶ map pin moves
                           ▶ emit('partner:location', admin)  ─────────────────────────▶ Live Map updates

                           PATCH /orders/:id/status (delivered)  ◀──────  rider taps "Mark delivered"
                           ▶ +30 to rider earnings
                           ▶ emit('order:status', order:{id})    ───▶ "Delivered ✓" timeline tick
```

---

## 📂 Project structure

```
Dailyzo/
├── backend/                    Node.js + Express + MongoDB + Socket.io
│   └── src/
│       ├── config/             env + mongo
│       ├── models/             User, Category, Product, Cart, Order,
│       │                       DeliveryPartner, Coupon, Transaction
│       ├── controllers/        auth, product, category, cart, order,
│       │                       payment, address, delivery, admin, coupon
│       ├── routes/             one file per controller
│       ├── middleware/         auth, error, upload
│       ├── services/           razorpay (real SDK + mock fallback)
│       ├── sockets/            real-time tracking handlers
│       ├── seeds/              seed.js (~30 products + 30 days of orders)
│       ├── app.js              Express app
│       └── server.js           HTTP + WebSocket boot
│
├── admin-web/                  React + Vite + Tailwind + Recharts + Leaflet
│   └── src/
│       ├── api/                axios + socket.io clients
│       ├── components/         PageHeader, Spinner
│       ├── layouts/            AdminLayout (sidebar)
│       ├── pages/              Login, Dashboard, Orders + drawer, Products,
│       │                       Inventory, Categories, DeliveryPartners,
│       │                       LiveMap, Customers, Coupons, Transactions
│       ├── store/              zustand auth store
│       └── utils/              formatters
│
├── mobile-app/                 Expo customer app
│   └── src/
│       ├── api/                axios + socket clients (platform-aware base URL)
│       ├── components/         Button, ProductCard, CartFooter
│       ├── navigation/         RootNavigation (auth gate + tabs + stack)
│       ├── screens/            Login, Home, Categories, CategoryProducts,
│       │                       ProductDetail, Search, Cart, Checkout,
│       │                       AddAddress, Orders, OrderTracking, Account
│       ├── store/              auth + cart (zustand + AsyncStorage)
│       ├── theme/              colors, radii, fontSize, shadow
│       └── utils/              formatters
│
└── delivery-app/               Expo rider app
    └── src/
        ├── api/                axios + socket
        ├── components/         Button
        ├── hooks/              useLiveLocation (GPS streaming)
        ├── navigation/         RootNavigation
        ├── screens/            Login, Home, ActiveOrder, History, Profile
        ├── store/              auth + duty
        ├── theme/              dark hero / light cards
        └── utils/              format + distance helper
```

---

## 🔑 Production hardening checklist

When you're ready to ship to real users:

### Secrets & infra
- Move `.env` values to a secret manager (AWS Secrets Manager, GCP Secret Manager, Doppler, etc.)
- Use **MongoDB Atlas** instead of local Mongo (paste the connection string into `MONGO_URI`)
- Use S3 / Cloudinary for product images instead of `/uploads`
- Add a CDN in front of static assets

### Backend
- Add request validation with **Zod** for every route (already a dep)
- Tighten the global rate limit per route family (e.g. 5/min for `/auth/otp/send`)
- Replace mock OTP with a real provider — **MSG91**, **Twilio**, or **Firebase Auth Phone**
- Add **Sentry** for error tracking
- Add structured logging (`pino` instead of `morgan`)
- Run with **PM2** or in a Docker container

### Payments (Razorpay)
1. Sign up at <https://dashboard.razorpay.com> and grab your **Key ID** + **Key Secret**.
2. Add to `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_XXXXXX
   RAZORPAY_KEY_SECRET=YOUR_SECRET
   ```
3. The backend already detects this and switches from mock mode to the real SDK automatically (`backend/src/services/razorpay.js`).
4. In the customer app, install `react-native-razorpay` and trigger the SDK with the `keyId` + `gatewayOrderId` returned by `POST /api/payments/order`. Then call `POST /api/payments/verify` with the result.

### Deployment

| Component | Recommended |
|---|---|
| Backend API | **Railway**, **Render**, **Fly.io** (one click); `npm start` is the entrypoint |
| MongoDB | **MongoDB Atlas** free tier |
| Admin Web | **Vercel** or **Netlify**; build with `npm run build`, set `VITE_API_URL` env |
| Customer + Rider apps | **Expo EAS Build** → submit to App Store / Play Store |

The Vite dev proxy disappears in production — set `VITE_API_URL` (and adjust `admin-web/src/api/client.js` to use it) to point at your hosted API.

### Mobile app — physical device

Edit `mobile-app/app.json` and `delivery-app/app.json`:

```json
"extra": {
  "API_URL": "https://api.dailyzo.com"
}
```

Then re-run `npx expo start`. Expo Go users will hit your hosted backend.

### Push notifications

Drop in **Expo Notifications** when ready:

```bash
cd mobile-app && npx expo install expo-notifications expo-device
```

On the backend, store the `expoPushToken` on the User and emit pushes alongside socket events for `order:status` changes. Expo's free push service handles delivery to both iOS and Android.

---

## 🗺 Roadmap

- [x] **Phase 1** — Backend + admin dashboard
- [x] **Phase 2** — Full admin pages + customer Expo app
- [x] **Phase 3** — Rider Expo app with live GPS streaming + Razorpay SDK integration

### Future ideas

- 🌍 i18n (Hindi / Tamil / Kannada / etc.)
- 🏪 Multi-store / dark store inventory split
- 🤖 Auto-assignment of orders to nearest available rider (geo-query is already a 2dsphere index)
- 📈 Analytics: rider heatmaps, customer cohorts, demand forecasting
- 🎁 Subscription delivery (daily milk, weekly veg basket)
- 💬 In-app chat between customer and rider via Socket.io

---

Built with care. The platform is fully functional end-to-end — place a real order in the customer app, watch it appear in the admin in real-time, assign it to a rider, see the rider's GPS update on the customer's tracking screen as they "ride". 🛒🛵
