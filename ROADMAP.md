# RentDrive — Full Project Roadmap

---

## 1. How the App Works (Big Picture)

| Step | What Happens |
|------|-------------|
| 1 | User registers → uploads ID + license photo → verified |
| 2 | User adds bank card → token saved (never the real card number) |
| 3 | User opens map → sees nearby available cars |
| 4 | User reserves car → backend locks the car in DB |
| 5 | User walks to car → taps "Unlock" → car door opens via relay |
| 6 | User drives → GPS pings every 30s → zones checked → surcharges applied |
| 7 | Trip ends in Green Zone → cost calculated → card auto-charged |
| 8 | Car locks → status back to AVAILABLE |

---

## 2. Hardware Per Car

### Electric Car (2015+) — e.g. Hongqi E-H3

| # | Item | Cost | Purpose |
|---|------|------|---------|
| 1 | ELM327 OBD-II Bluetooth adapter | $5–10 | Reads battery %, speed, range, temp |
| 2 | Raspberry Pi Zero W | $15 | Brain — runs all scripts |
| 3 | 4G USB dongle + SIM (Beeline/Tcell) | $10 | Sends data to server |
| 4 | 12V USB power adapter (car socket) | $5 | Powers the Pi |
| 5 | Door lock relay module | $5 | Remote lock/unlock |
| 6 | 70mai Dash Cam (GPS) | $30–50 | Trip recording + speed evidence |
| | **Total** | **~$70–95** | |

### Fuel Car (2015+)

| # | Item | Cost | Purpose |
|---|------|------|---------|
| 1 | ELM327 OBD-II Bluetooth adapter | $5–10 | Reads fuel %, speed, engine temp |
| 2 | Raspberry Pi Zero W | $15 | Brain |
| 3 | 4G USB dongle + SIM | $10 | Sends data |
| 4 | 12V USB power adapter | $5 | Power |
| 5 | Door lock relay module | $5 | Remote lock/unlock |
| 6 | 70mai Dash Cam | $30–50 | Trip recording |
| | **Total** | **~$70–95** | |

### Old Fuel Car (before 2015)

| # | Item | Cost | Purpose |
|---|------|------|---------|
| 1 | ELM327 OBD-II adapter | $5–10 | Basic speed/RPM only (fuel PID often missing) |
| 2 | External fuel sensor | $20–30 | Clips to fuel tank — reads level directly |
| 3 | Raspberry Pi Zero W | $15 | Brain |
| 4 | 4G USB dongle + SIM | $10 | Sends data |
| 5 | 12V USB power adapter | $5 | Power |
| 6 | Door lock relay module | $5 | Remote lock/unlock |
| 7 | 70mai Dash Cam | $30–50 | Trip recording |
| | **Total** | **~$90–125** | |

---

## 3. What Data Each Car Type Sends

| Data | EV (2015+) | Fuel (2015+) | Old Fuel (pre-2015) |
|------|:---:|:---:|:---:|
| GPS location | ✅ | ✅ | ✅ |
| Speed | ✅ | ✅ | ✅ |
| Battery % | ✅ | ❌ | ❌ |
| Fuel % | ❌ | ✅ | ⚠️ external sensor |
| Range (km) | ✅ | ✅ | ❌ |
| Engine temp | ✅ | ✅ | ⚠️ sometimes |
| Door lock/unlock | ✅ relay | ✅ relay | ✅ relay |
| Engine start/stop | ✅ relay | ✅ relay | ✅ relay |

### OBD-II PIDs to read

| PID | Data | Works on |
|-----|------|----------|
| 0x0D | Speed (km/h) | All cars |
| 0x2F | Fuel level % | Fuel cars 2015+ |
| 0x5B | Battery charge % | EVs |
| 0x5C | Battery temperature | EVs |
| 0x61 | Estimated range (km) | EVs |
| 0x05 | Engine coolant temp | Fuel cars |

---

## 4. Zone System

| Zone | Area | Rate Multiplier | Action |
|------|------|:-:|---------|
| 🟢 Green | Dushanbe city centre | 1x (normal) | Safe to park and end trip |
| 🟡 Yellow | City outskirts | 1.5x | Warning sent to driver |
| 🔴 Red | Outside city | 2x (double) | Alert + surcharge auto-charged |

### Zone coordinates (Dushanbe)
```
Green:  lat 38.530–38.592 / lon 68.745–68.808
Yellow: lat 38.485–38.635 / lon 68.675–68.875
Red:    anything outside Yellow
```

### How surcharge is calculated
```
Every 30s GPS ping → zone checked
Yellow → extra 0.75 TJS/min (on top of normal 1.5 TJS/min = 2.25 total)
Red    → extra 1.5  TJS/min (on top of normal 1.5 TJS/min = 3.0 total)
All surcharges accumulated in DB → added to final bill
```

---

## 5. Fuel & Battery Monitoring

### Electric Car Thresholds

| Battery / Range | Action |
|----------------|--------|
| Below 60 km range | Warning notification to driver |
| Below 30 km range | Driver must go to charging station |
| Below 15 km range | Car blocked from new rentals |
| 0 km | Car fully blocked |

### Fuel Car Thresholds

| Fuel Level | Action |
|-----------|--------|
| Below 30% | Warning notification to driver |
| Below 20% | Admin gets REFUEL task created |
| Below 10% | Driver gets urgent alert, trip cannot be extended |
| 0% | Car blocked from new rentals |

---

## 6. Engine & Door Safety Rules

| Situation | Action |
|-----------|--------|
| Speed > 5 km/h | NEVER cut engine — queue command |
| Speed = 0 | Safe to lock / immobilize |
| Admin queues immobilize | Executes automatically when car stops |
| Trip ends while moving | Block end — must be stationary |

### Remote commands (via device SIM)
| Command | Internet | SMS fallback |
|---------|:---:|:---:|
| Unlock doors | ✅ | ✅ |
| Lock doors | ✅ | ✅ |
| Start engine | ✅ | ✅ |
| Immobilize | ✅ (safe check) | ✅ (safe check) |
| Get status | ✅ | ✅ |

---

## 7. Bank Card & Payments

### How it works
| Step | What happens |
|------|-------------|
| 1 | User enters card in app |
| 2 | Payment provider tokenizes it → you get a TOKEN (not card number) |
| 3 | Trip starts → pre-auth HOLD placed on card (e.g. 200 TJS) |
| 4 | Zone violations → charged immediately from token |
| 5 | Trip ends → exact final amount captured, hold released |
| 6 | Card fails → account blocked until paid |

### Payment providers for Tajikistan

| Provider | Best for | Notes |
|----------|---------|-------|
| **Alif Bank API** | ✅ Best for TJ | Local bank, TJS currency, Tajik cards |
| **PayMe** | ✅ Good | Uzbekistan-based, works in TJ, great API docs |
| **Click** | ✅ OK | Also Uzbekistan-based |
| **Stripe** | ❌ | Tajikistan not supported |
| **Korvon** | ✅ | National TJ payment system |

---

## 8. Traffic Violations

### Government fines (speed cameras, red lights)
```
Fine letter arrives to your company (car is registered to you)
    ↓
Admin enters: date, time, car plate, fine amount, photo
    ↓
System auto-finds who was renting that car at that exact time
    ↓
Charges client card = fine amount + 20% admin fee
    ↓
Client notified: "Traffic fine charged: 150 TJS"
```

### Your own speed enforcement

| Zone | Speed Limit | Fine |
|------|:-----------:|------|
| Green (city) | 60 km/h | 50 TJS |
| Yellow (outskirts) | 80 km/h | 75 TJS |
| Red (highway) | 110 km/h | 100 TJS |
| Any zone | 130+ km/h | 200 TJS + admin alert |

### Violation statuses
`PENDING` → `CHARGED` → `DISPUTED` → `WRITTEN_OFF`

---

## 9. Offline / Bad Network (Outside Dushanbe)

| Problem | Solution |
|---------|---------|
| No 4G signal | Device buffers GPS data locally |
| Signal returns | Device sends all buffered data at once (store-and-forward) |
| Critical command (lock/unlock) | SMS fallback — works with 1 bar signal |
| Client leaves city | Pre-auth deposit charged before departure |
| Deep remote area (Pamir etc.) | Thuraya/Globalstar satellite SIM ($30–50/month) |

### Network coverage by SIM

| SIM | Coverage |
|-----|---------|
| Beeline TJ | Most populated areas |
| Tcell | Most populated areas |
| Roaming both | Khujand, Kulyab, Bokhtar |
| Satellite | Entire Tajikistan including Pamir |

---

## 10. Map

### Comparison for Tajikistan

| Provider | TJ Coverage | Price | Verdict |
|----------|:-----------:|-------|---------|
| **Yandex Maps** | ⭐⭐⭐⭐⭐ | Free up to 1000 req/day | **Best choice** |
| **2GIS** | ⭐⭐⭐⭐⭐ | Free up to 1000 req/day | Best alternative |
| Google Maps | ⭐⭐⭐ | $200/month | Too expensive, weak TJ |
| OpenStreetMap + Leaflet | ⭐⭐⭐ | Free forever | Good budget option |
| Mapbox | ⭐⭐ | $50/month | Poor TJ detail |

### Request usage estimate

```
1 user opens map = ~6 requests
1000 req/day free tier = ~166 map sessions/day = enough for 50–150 users
```

### When to pay / negotiate

| Users | Map Cost | Action |
|-------|---------|--------|
| 0–100 | $0 | Free tier |
| 100–500 | ~$20/month | Pay as you go |
| 500–2000 | ~$60/month | Pay as you go |
| 2000+ | ~$100/month | Contact for partnership deal |

### Partnership contact
- Yandex: `maps-api@yandex-team.ru`
- 2GIS: `api@2gis.com`
- Mention: carsharing startup in Dushanbe, expected users, request startup discount

---

## 11. Backend Endpoints to Build

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|:------:|
| `/cars/:id/telemetry` | POST | Device sends GPS, speed, fuel/battery | ❌ Not built |
| `/rentals/:id/ping` | POST | Phone sends GPS during trip → zone check → surcharge | ❌ Not built |
| `/cars/:id/unlock` | POST | Unlock car doors | ❌ Not built |
| `/cars/:id/lock` | POST | Lock car doors | ❌ Not built |
| `/cars/:id/engine/start` | POST | Start engine (safety check) | ❌ Not built |
| `/cars/:id/engine/stop` | POST | Stop engine (safety check) | ❌ Not built |
| `/payments/add-card` | POST | Tokenize and save client card | ❌ Not built |
| `/payments/charge` | POST | Charge saved card token | ❌ Not built |
| `/payments/card` | GET | Get saved card info | ❌ Not built |
| `/violations` | POST | Admin adds traffic fine | ❌ Not built |
| `/violations/:id/charge` | POST | Charge client for violation | ❌ Not built |
| `/rentals/start` | POST | Start rental | ✅ Built |
| `/rentals/end` | POST | End rental + calculate cost | ✅ Built |
| `/rentals/active` | GET | Get active rental | ✅ Built |
| `/cars/public` | GET | Get available cars | ✅ Built |

---

## 12. Database Fields to Add

### Rental model
```
outOfZoneMinutes  Float   — minutes spent outside green zone
zoneSurcharge     Float   — extra cost from zone penalties
lastKnownLat      Float?  — last GPS ping latitude
lastKnownLon      Float?  — last GPS ping longitude
lastKnownSpeed    Float   — speed from last ping (km/h)
lastPingAt        DateTime? — when device last pinged
```

### User model
```
paymentToken      String?  — token from payment provider
paymentProvider   String?  — "alif" | "payme"
cardLastFour      String?  — for display only "•••• 4242"
```

### New model: TrafficViolation
```
id, carId, rentalId, userId
type: SPEEDING | RED_LIGHT | PARKING | OTHER
fineAmount, serviceFee, totalCharged
violationAt (DateTime), location, evidenceUrl
status: PENDING | CHARGED | DISPUTED | WRITTEN_OFF
```

---

## 13. Testing Plan (Your Hongqi E-H3)

| Week | Action | Cost | Goal |
|------|--------|------|------|
| **Week 1** | Use phone as tracker | $0 | Test GPS, zones, trip flow, cost |
| **Week 2** | Buy ELM327 OBD adapter | $10 | Read real battery % and speed |
| **Week 3** | Buy Raspberry Pi + SIM | $25 | Permanent install, offline buffer |
| **Week 4** | Buy 70mai dashcam | $40 | Record trips, violation evidence |
| **Month 2** | Register Alif Bank merchant | $0 | Enable real card charging |
| **Month 2** | Contact Yandex/2GIS | $0 | Partnership deal for map API |
| **Month 3** | Launch with real users | — | First 50 paying customers |

---

## 14. Total Budget

| Item | Cost |
|------|------|
| Testing (phone only) | **$0** |
| 1 EV car full kit | **~$75–95** |
| 1 fuel car (2015+) full kit | **~$75–95** |
| 1 old fuel car (pre-2015) kit | **~$90–125** |
| Map API (free tier) | **$0** |
| Payment gateway setup | **$0** (% per transaction after launch) |
| **Start with 1 car (your E-H3)** | **~$75–95** |

---

## 15. What Already Exists in Your Code

| Feature | File | Status |
|---------|------|:------:|
| User auth (JWT) | `authController.ts` | ✅ Done |
| Car CRUD | `carController.ts` | ✅ Done |
| Rental start/end | `rentalController.ts` | ✅ Done |
| Cost calculation | `tariffService.ts` | ✅ Done |
| Zone detection | `geoService.ts` | ✅ Done |
| Fuel monitor job | `fuelMonitor.ts` | ✅ Done |
| Trip expiry monitor | `tripMonitor.ts` | ✅ Done |
| Admin dashboard | `admin/` pages | ✅ Done |
| Notifications | `notificationController.ts` | ✅ Done |
| Map page | `client/map/page.tsx` | ⚠️ No map library yet |
| Zone surcharge | — | ❌ Not built |
| Real telemetry endpoint | — | ❌ Not built |
| Door/engine commands | — | ❌ Not built |
| Payment integration | — | ❌ Not built |
| Traffic violations | — | ❌ Not built |
| Offline buffer sync | — | ❌ Not built |
