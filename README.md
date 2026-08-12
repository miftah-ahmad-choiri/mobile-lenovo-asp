# Lenovo ASP — Mobile App

React Native (Expo) mobile companion for the Lenovo ASP Portal.
Targets Android and iOS. ASP staff users can track Work Order
follow-up statuses on the go.

---

## Table of Contents

- [What is this app?](#what-is-this-app)
- [How to Run (Development)](#how-to-run-development)
- [How to Install on Android (Standalone APK)](#how-to-install-on-android-standalone-apk)
- [How to Publish to Play Store / App Store](#how-to-publish-to-play-store--app-store)
- [Prerequisites (One-time Setup)](#prerequisites-one-time-setup)
- [Backend Requirement](#backend-requirement)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
  - [Login fails on standalone APK](#login-fails-on-the-standalone-apk-even-with-correct-credentials)
  - [App connects but shows no data](#app-connects-but-shows-no-data--network-error)

---

## What is this app?

This is the **Lenovo ASP mobile companion app**. It is designed for
ASP staff users (`asp_user` role) to track Work Order follow-up
statuses directly from their phone.

### Features (MVP)

| Tab | What it shows |
|-----|---------------|
| **Follow-Up → In-Prepare** | Open WOs with parts ordered but not yet shipped |
| **Follow-Up → CCI Follow-Up** | Carry-In WOs with computed follow-up state |
| **Follow-Up → Onsite Follow-Up** | Onsite WOs with computed follow-up state |
| **Return Part** | Closed WOs needing DC number input |
| **Profile** | ASP info from your account + sign out |

Tap any Work Order row to see full details including part lines.

### Login

Use your ASP staff email and password (same credentials as the web portal).

> Example: `miftah.choiri@ibm.com`

---

## How to Run (Development)

This is for **developers only**. If you just want to install the app
on your phone, skip to [How to Install on Android](#how-to-install-on-android-standalone-apk).

### What you need

- Node.js installed → see [Prerequisites](#prerequisites-one-time-setup)
- Expo Go app on your phone → see [Prerequisites](#prerequisites-one-time-setup)
- Flask server running on your PC
- Your phone and PC on the **same Wi-Fi network**

### Step 1 — Start the Flask backend

Open a PowerShell terminal and run:

```powershell
cd backup-deploy-lenovo-development-test
$env:PYTHONIOENCODING = "utf-8"; .venv\Scripts\Activate.ps1
python run.py
```

The server runs at `http://localhost:5000`. Leave this terminal open.

### Step 2 — Start the Expo dev server

Open a **second** PowerShell terminal and run:

```powershell
cd mobile-lenovo-asp
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
npx expo start
```

A QR code appears in the terminal.

### Step 3 — Open on your phone

1. Open **Expo Go** on your phone
2. Tap **Scan QR code**
3. Point your camera at the QR code in the terminal
4. The app loads on your phone

> **You only need to scan once per session.** After that, any code
> changes you make on your PC reload the app automatically on your
> phone — no scan needed again.

### Step 4 — Log in

Enter your ASP staff email and password on the login screen.

### Running in a browser (no phone needed)

```powershell
npx expo start --web
```

Opens the app in your browser at `http://localhost:8081`.
Useful for quick UI checks without a phone.

---

## How to Install on Android (Standalone APK)

This produces a **real installable APK** — no Expo Go, no PC running,
no QR scan. Just install and open like any normal app.

### What you need

- A free Expo account at https://expo.dev (sign up takes 1 minute)
- EAS CLI installed: `npm install -g eas-cli`

### Step 1 — Switch API URL to production

Open [`services/api.ts`](services/api.ts) and make these **3 changes**:

```typescript
// Line 18 — uncomment (remove the leading //):
const PROD     = "https://app.ticket-asp.my.id";

// Line 20 — comment out (add // at the start):
// export const BASE_URL = Platform.OS === "web" ? DEV_WEB : DEV_DEVICE;

// Line 21 — uncomment (remove the leading //):
export const BASE_URL = PROD;
```

> ⚠️ **Important:** If you skip this step the APK will point to your
> local PC's IP address (`192.168.1.6:5000`) and login will fail on
> any phone that is not on the same Wi-Fi as your PC.

### Step 2 — Log in to Expo

```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
eas login
```

Enter your expo.dev email and password.

### Step 3 — Build the APK

```powershell
cd mobile-lenovo-asp
eas build --platform android --profile preview
```

- EAS uploads your code to Expo's cloud build servers
- Build takes about **5–10 minutes**
- When done, you get a **download link** for the `.apk` file

### Step 4 — Install on Android

1. Download the `.apk` file from the link EAS gives you
2. Send it to your phone (WhatsApp, email, Google Drive — any way)
3. Open the file on your Android phone
4. If prompted **"Install from unknown sources"**, tap **Settings →
   enable for this source → go back → Install**
5. The app installs with its own icon on the home screen

> This "unknown sources" prompt only appears **once** — the first
> time you install an APK that is not from the Play Store. After
> enabling it once, future APK installs are one tap.

### Step 5 — Share with other ASP users

Upload the `.apk` to Google Drive, OneDrive, or **Box** and share the
download link. Any Android user can install it the same way.

### Step 6 — Publish to IBM Box (recommended for IBM/ASP teams)

IBM Box is the recommended distribution channel for internal ASP staff.

1. Go to **https://ibm.box.com** and sign in with your IBM credentials
2. Navigate to (or create) a folder, e.g. `Lenovo ASP / Mobile App`
3. Click **Upload** → select the `.apk` file
4. Hover over the uploaded file → click the **Share** (🔗) icon
5. Set access to **"People with the link"** (or **"People in IBM"**)
6. Click **Copy Link** → share with ASP staff via email or WhatsApp

> **Updating the app:** When you release a new version, upload the new
> `.apk` to the same Box folder and update the shared link if it
> changes. Users must manually download and reinstall — there is no
> auto-update for sideloaded APKs.

---

## How to Publish to Play Store / App Store

Publishing to a store means ASP users install the app **exactly like
WhatsApp or any other app** — from the store, with automatic updates.

### Android — Google Play Store

| Step | Detail |
|------|--------|
| 1. Create a Google Play Developer account | https://play.google.com/console — **$25 USD one-time fee** |
| 2. Switch API URL to production | Change `BASE_URL` in `services/api.ts` (see above) |
| 3. Build the release bundle | `eas build --platform android --profile production` |
| 4. Download the `.aab` file from EAS | |
| 5. Upload to Play Console | Play Console → Create app → Production → Upload |
| 6. Fill in store listing | App name, description, screenshots |
| 7. Submit for review | Google reviews in **1–3 days** |
| 8. Publish | ASP users search for the app or use your share link |

**Internal Testing Track (recommended for business apps):**
Instead of a public listing, use the **Internal Testing** track.
You add specific email addresses (your ASP partners) and only they
can see and install the app. No public listing needed.

### iOS — Apple App Store

| Step | Detail |
|------|--------|
| 1. Join Apple Developer Program | https://developer.apple.com — **$99 USD/year** |
| 2. Switch API URL to production | Change `BASE_URL` in `services/api.ts` (see above) |
| 3. Build the iOS app | `eas build --platform ios` |
| 4. Submit to App Store | `eas submit --platform ios` |
| 5. Review | Apple reviews in **1–3 days** |

**Apple TestFlight (recommended for internal distribution):**
Before full App Store release, use **TestFlight** to distribute to
up to 10,000 internal testers by email invitation — no public listing
needed, no extra cost beyond the developer account.

### Automatic updates after publishing

Once in the store, every time you publish a new version:
- Android users get a notification: "Update available" → tap Update
- iOS users same experience

For **small code-only changes** (no new native features), you can
push updates instantly using Expo OTA (over-the-air) — the app
updates silently in the background without any store submission:

```powershell
eas update --branch production --message "Fix WO list loading"
```

---

## Development vs Production — Summary

| | Development (Expo Go) | Standalone APK | Play Store / App Store |
|---|---|---|---|
| How to open | QR scan in Expo Go | Tap app icon | Tap app icon |
| Needs PC running | ✅ Yes | ❌ No | ❌ No |
| Needs Expo Go | ✅ Yes | ❌ No | ❌ No |
| Who can use it | Developer only | Anyone with the APK file | Anyone |
| Connects to server | localhost:5000 | app.ticket-asp.my.id | app.ticket-asp.my.id |
| Cost | Free | Free | $25 Android / $99 iOS |
| Updates | Instant (hot reload) | Reshare new APK | Automatic via store |

---

## Prerequisites (One-time Setup)

These steps only need to be done **once** on your development PC.

### 1. Node.js

Download and install **Node.js LTS** (v20 or v22):
https://nodejs.org/en/download

Choose the **Windows Installer (.msi)** for your architecture (x64).

> If you install to a custom path (e.g. `E:\Program Files\Node.js`),
> you must add it to your system PATH manually — see Troubleshooting.

Verify in a **new** PowerShell window:

```powershell
node --version   # v20.x or higher
npm --version    # 10.x or higher
npx --version    # 10.x or higher
```

### 2. Expo CLI and EAS CLI

```powershell
npm install -g expo-cli eas-cli
```

### 3. Expo Go (for development testing on phone)

Install **Expo Go** from the app store on your phone:

- Android: https://play.google.com/store/apps/details?id=host.exp.exponent
- iOS: https://apps.apple.com/app/expo-go/id982107779

> Expo Go is only needed during **development**. Once you build a
> standalone APK, Expo Go is no longer needed.

### 4. Install project dependencies

```powershell
cd mobile-lenovo-asp
npm install
```

---

## Backend Requirement

The mobile app calls the Lenovo ASP Flask server for all data.

| Mode | Server URL | Set in |
|------|-----------|--------|
| Development (browser) | `http://localhost:5000` | `services/api.ts` line 16 |
| Development (device) | `http://192.168.1.6:5000` | `services/api.ts` line 17 |
| Production | `https://app.ticket-asp.my.id` | `services/api.ts` lines 18, 20–21 |

Switch between them by editing [`services/api.ts`](services/api.ts)
**lines 18, 20, and 21**:

```typescript
// ── Development (default) ─────────────────────────────────────────────────────
const DEV_WEB    = "http://localhost:5000";
const DEV_DEVICE = "http://192.168.1.6:5000";
// const PROD    = "https://app.ticket-asp.my.id";   // ← commented out

export const BASE_URL = Platform.OS === "web" ? DEV_WEB : DEV_DEVICE;
// export const BASE_URL = PROD;

// ── Production (for APK builds) ───────────────────────────────────────────────
const DEV_WEB    = "http://localhost:5000";
const DEV_DEVICE = "http://192.168.1.6:5000";
const PROD       = "https://app.ticket-asp.my.id";   // ← uncomment this

// export const BASE_URL = Platform.OS === "web" ? DEV_WEB : DEV_DEVICE;  // ← comment out
export const BASE_URL = PROD;                                               // ← uncomment this
```

> ⚠️ **Cloudflare Tunnel must be running** for `app.ticket-asp.my.id`
> to be reachable. If the tunnel is off on the host PC, the app cannot
> connect even with the correct production URL. See the
> `backup-deploy-lenovo-development-test` README for tunnel setup.

---

## Project Structure

```
mobile-lenovo-asp/
├── app/
│   ├── _layout.tsx                  # Root layout + auth guard (redirects to login or tabs)
│   ├── login.tsx                    # Login screen
│   └── (tabs)/
│       ├── _layout.tsx              # 3-tab bottom navigation bar
│       ├── followup/
│       │   ├── _layout.tsx          # Sub-tab bar: In-Prepare | CCI | Onsite
│       │   ├── in-prepare.tsx       # In-Prepare Follow-Up list
│       │   ├── cci.tsx              # CCI Follow-Up list
│       │   └── onsite.tsx           # Onsite Follow-Up list
│       ├── return-part.tsx          # Return Part list
│       └── profile.tsx              # Profile screen + logout
├── components/
│   ├── WOListItem.tsx               # Reusable WO row card
│   ├── WODetailSheet.tsx            # Bottom sheet: full WO details + parts
│   └── WOScreen.tsx                 # Shared screen layout (search + list + detail)
├── hooks/
│   └── useWOList.ts                 # Shared data-fetching hook (pagination, refresh)
├── services/
│   └── api.ts                       # Axios instance with JWT auto-attach
├── stores/
│   └── authStore.ts                 # Zustand auth state (persisted to SecureStore)
├── app.json                         # Expo app config (name, bundle ID, plugins)
├── package.json                     # npm dependencies
└── README.md                        # This file
```

---

## Troubleshooting

### `node` or `npm` not found after install

**Cause:** Node was installed to a non-default path and Windows PATH
was not updated.

**Fix — run once in PowerShell as Administrator:**

```powershell
$nodePath = "E:\Program Files\Node.js"
$current = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
if ($current -notlike "*$nodePath*") {
    [System.Environment]::SetEnvironmentVariable("PATH", "$nodePath;$current", "Machine")
    Write-Host "Done. Close and reopen PowerShell."
} else {
    Write-Host "Path already present."
}
```

Close all PowerShell windows and open a fresh one, then verify
`node --version`.

---

### Node found in Admin PowerShell but not in normal PowerShell

Run this in any PowerShell (no admin needed) to reload PATH for the
current session:

```powershell
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
```

---

### `expo: command not found` after installing expo-cli

The global npm bin directory is not on your PATH. Fix it:

```powershell
$npmBin = npm config get prefix
$current = [System.Environment]::GetEnvironmentVariable("PATH", "User")
if ($current -notlike "*$npmBin*") {
    [System.Environment]::SetEnvironmentVariable("PATH", "$npmBin;$current", "User")
    Write-Host "Done. Close and reopen PowerShell."
} else {
    Write-Host "Path already present."
}
```

---

### Expo Go can't connect to dev server (QR scan loads then fails)

1. Make sure your phone and PC are on the **same Wi-Fi network**
2. Press `t` in the Expo terminal to switch to **tunnel mode** —
   this routes through Expo's cloud and works across different
   networks or when on a corporate Wi-Fi that blocks device-to-device
3. If tunnel mode also fails, check Windows Firewall allows `node.exe`
   on private networks

---

### APK install blocked on Android ("Install blocked")

Android blocks APKs from unknown sources by default. To allow it:

1. Tap the downloaded `.apk` file
2. Tap **Settings** on the prompt
3. Enable **"Allow from this source"**
4. Go back and tap **Install**

This only needs to be done once per phone.

---

### Login returns "Invalid username or password"

- Make sure you are using your **email address** as the username
  (e.g. `miftah.choiri@ibm.com`), not a username string
- Check the password matches what is stored in the ASP portal
- If the dev server is running, check `http://localhost:5000` loads
  in a browser to confirm Flask is up

### Login fails on the standalone APK (even with correct credentials)

**Cause:** The APK was built while `services/api.ts` still pointed to
the local PC IP (`192.168.1.6:5000`) instead of the production URL.
The phone cannot reach your PC across mobile data or other Wi-Fi.

**Fix:**
1. Open [`services/api.ts`](services/api.ts) and switch to production
   — see [Step 1 of the APK build guide](#step-1--switch-api-url-to-production)
2. Rebuild: `eas build --platform android --profile preview`
3. Download and reinstall the new `.apk`

### App connects but shows no data / "Network Error"

**Cause:** The Cloudflare Tunnel (`app.ticket-asp.my.id`) is not
running on the host PC.

**Fix:** On the host PC, start the tunnel:

```powershell
cd backup-deploy-lenovo-development-test
.\cloudflared\cloudflared.exe tunnel run asp-ticketing
```

And in a second terminal, start Flask:

```powershell
$env:PYTHONIOENCODING = "utf-8"; .venv\Scripts\Activate.ps1
python run.py
```

Both must be running for the production app to work.
