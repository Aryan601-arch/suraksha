# Suraksha — Insurance Marketplace (Nepal)

A front-end UI prototype of an insurance comparison/aggregator app for Nepal
— motor, health, travel, property, marine, aviation, agri and business
cover, compared across all 14 non-life insurers currently licensed by the
Nepal Insurance Authority.

It is **not** a working backend — no real underwriting, KYC verification,
or payments. Everything runs in-memory and resets on page refresh.

Every premium figure is either a real regulatory rate cited inline in the
code (with its source directive), or an explicitly-labeled invented
placeholder where no public rate table exists — see the comments in
`src/App.jsx` for exactly which is which, product by product.

## Running locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- Responsive: fills the viewport on phones/small screens, shows a
  phone-frame mockup on wider (desktop) screens for presentation.
- The travel and marine-cargo quote forms call Nepal Rastra Bank's public
  forex API for a live exchange rate; if that call is blocked by CORS or no
  rate is published yet for today, the form falls back to manual entry.
- This is a prototype only. A real launch would need: confirmed real rate
  tables from each insurer (most premiums here are placeholders), actual
  underwriting/partnership agreements, a real backend with payment and
  document verification, and a compliance review under the Insurance Act.
