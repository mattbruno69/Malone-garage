# MALONE GARAGE v1.5 — iPhone push setup

The app remains on GitHub Pages. The push delivery service requires OneSignal + Cloudflare Workers + D1. **The app is built, but alerts will NOT work until this setup is complete.** Your DVLA/DVSA keys are not needed for reminders.

## 0. Back up first
Open your currently installed MALONE GARAGE → Settings → Export backup. Save the JSON to Files. Updating the GitHub app does not intentionally clear `maloneGarageV1` localStorage, but Safari storage can be cleared by the OS and the Home Screen app may have a different storage container from Safari.

## 1. Upload the static website
From the ZIP, upload the files **at the ZIP root** to your `mattbruno69/Malone-garage` GitHub repository: `index.html`, `manifest.webmanifest`, `OneSignalSDKWorker.js`, `worker-cache.js`, `sw.js`, `worker.js`, the JPGs and `icon.png`. Do **not** upload `reminder-worker/` to your public GitHub repository: it is backend source, not a website asset. Keep your existing API gateway separate. Check https://mattbruno69.github.io/Malone-garage/ and Settings → iPhone push reminders.

## 2. Create a OneSignal web-push app
Go to https://onesignal.com/ and create a **Web Push** app. Use site origin `https://mattbruno69.github.io` (the full site URL is `https://mattbruno69.github.io/Malone-garage/`). Configure the **custom service worker** `OneSignalSDKWorker.js` under the repository path and its scope `/Malone-garage/`. OneSignal's dashboard may ask for the complete worker URL: `https://mattbruno69.github.io/Malone-garage/OneSignalSDKWorker.js`. Follow the dashboard's current custom-service-worker guidance; the site is hosted in a GitHub Pages subdirectory, not at the domain root. Confirm the service worker path/scope is accepted. If OneSignal does not support this Pages subpath, use a custom domain or another compatible web-push provider rather than exposing credentials.

Copy **OneSignal App ID** (public). Separately obtain the **REST API Key** (private; only use as Cloudflare secret).

## 3. Create a Cloudflare Worker + D1
Install Node.js and Wrangler on a computer, or use Cloudflare's dashboard editor and D1 console. The provided files are in `reminder-worker/`.

```bash
cd reminder-worker
npm install -g wrangler
wrangler login
wrangler d1 create malone-garage-reminders
```

Paste the returned D1 `database_id` into `wrangler.toml`. Replace `ONESIGNAL_APP_ID` with your actual App ID. Keep `ALLOWED_ORIGIN` set to `https://mattbruno69.github.io` and `APP_URL` to your GitHub Pages URL.

```bash
wrangler d1 execute malone-garage-reminders --remote --file=./schema.sql
wrangler secret put ONESIGNAL_REST_API_KEY
wrangler deploy
```

When prompted for the secret, paste the OneSignal REST API key. **Never put the REST API key in GitHub or the app's Settings.** The Worker has a daily scheduled trigger at 09:00 UTC; Cloudflare cron uses UTC (10:00 in the UK during BST). Check Cloudflare Worker logs for delivery errors.

## 4. Connect your iPhone
1. Open the GitHub Pages website in **Safari** and choose **Share → Add to Home Screen**. Launch the installed MALONE GARAGE icon (not an ordinary Safari tab). On iOS 16.4+ Home Screen web apps can request web-push permission.
2. In MALONE GARAGE → Settings → iPhone push reminders, enter your **OneSignal App ID** and the deployed Worker HTTPS URL (e.g. `https://malone-garage-reminders.username.workers.dev`). Tap **Save reminder connection**.
3. Tap **Enable iPhone notifications** and allow notifications when prompted. The app associates this device with a random ID and uploads the four types of entered due dates to Cloudflare D1.
4. Tap **Sync deadlines now** after editing records, if needed. Normal saves also trigger a sync once you have synced successfully before.
5. Check **View sent reminder history** after the scheduled date. A reminder is sent only when the due date is exactly 30 or 7 days away at the daily check. It is not retroactively sent for dates already inside those windows.

## Privacy, safety and limits
- **Vehicle records** remain stored under the existing localStorage key `maloneGarageV1` on your device. The Worker receives only vehicle ID, vehicle name, registration, deadline type and due date, and stores a SHA-256 hash of a long random device bearer secret; the raw secret remains on your device. OneSignal receives a random external ID and the reminder message.
- The Worker accepts requests only from the configured website origin, but **CORS is not authentication**. It additionally authenticates each device using its secret. Keep the OneSignal REST key in Cloudflare secrets.
- Push depends on internet, iOS permissions, OneSignal and Cloudflare uptime/quotas; no push service guarantees exact delivery time. Check the app's deadlines regularly as a backup.
- A 7-day follow-up is skipped when you clear the date or replace it with a new later date and the sync succeeds. Merely entering a service history note does not mark the upcoming deadline complete; update/clear its due-date field.
- Reminders are checked once per day, using Europe/London for the current date. No automatic DVLA/DVSA lookup is required. Cloudflare and OneSignal may have free tiers with limits; verify your account's current allowances.
- If you reinstall the app or clear browser storage, re-enable and resync. The server-side schedule may persist until the new installation is configured; delete records from D1 if you want to remove old device schedules.

## Troubleshooting
- **No notification permission prompt**: launch from Home Screen on iOS 16.4+ and check OneSignal SDK configuration and the service worker URL/scope.
- **Sync failed**: check the Worker URL, D1 schema, Allowed Origin, Worker logs and browser connectivity.
- **No push despite successful sync**: verify the OneSignal subscription is opted in and associated with the same external ID; check OneSignal delivery logs and Cloudflare cron logs.
- **Old version**: allow GitHub Pages to deploy, close/reopen app, and check the cache. Export a backup before clearing website data.
