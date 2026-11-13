# MALONE GARAGE — Government API setup

The app works without APIs. To enable live government lookups, deploy `worker.js` as a Cloudflare Worker. **Never paste API credentials into `index.html`, a GitHub repository, or the app's gateway URL box.**

1. Register for a free DVLA VES key: https://developer-portal.driver-vehicle-licensing.api.gov.uk/apis/vehicle-enquiry-service/vehicle-enquiry-service-description.html
2. Optional: apply for DVSA MOT History API access: https://documentation.history.mot.api.gov.uk/mot-history-api/register (approval can take up to five working days).
3. In Cloudflare Workers, create a Worker and paste `worker.js` as its code. Under Worker Settings > Variables and Secrets, set **secret** `DVLA_KEY` to your DVLA key. Set plain variable `ALLOWED_ORIGIN` to your app's origin, e.g. `https://YOURNAME.github.io` (no trailing slash or repository path).
4. For DVSA, additionally set **secrets** `DVSA_KEY`, `DVSA_CLIENT_ID`, `DVSA_CLIENT_SECRET`, `DVSA_SCOPE`, `DVSA_TOKEN_URL` exactly as provided by DVSA. DVSA uses OAuth client credentials, not only an API key.
5. Deploy. In MALONE GARAGE > Settings, enter the HTTPS Worker URL (without trailing slash). Open a car, add its registration, save, then select **Refresh official records**.

The Worker is deliberately restricted to your specified website origin. This is a basic safeguard, **not user authentication**; public browser apps can still be impersonated outside the browser. For stronger privacy and protection against quota abuse, use Cloudflare Access or an authenticated backend. A free Cloudflare tier may have usage limits; check Cloudflare's current terms.

DVLA returns MOT expiry/status and tax due/status when available. DVSA returns MOT history, mileage readings, results and advisories. The app stores the raw government response locally in the vehicle record and updates MOT and tax dates only if provided. Insurance and servicing remain manual. No automated background updates or push notifications are implemented.
