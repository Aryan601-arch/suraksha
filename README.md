# Suraksha — Insurance Marketplace (Nepal)

A front-end UI prototype of an insurance comparison/aggregator app for Nepal
— motor, health, travel, property, marine, aviation, agri and business
cover, compared across the 14 non-life insurers currently licensed by the
Nepal Insurance Authority.

Not every insurer sells every product, and the app reflects that: each
product's comparison screen lists only the insurers who actually write that
cover (aviation is written by 10 of the 14, householder cover by 6, and
some products are a single insurer's own branded plan).

It is **not** a working backend — no real underwriting, KYC verification,
or payments. Everything runs in-memory and resets on page refresh.

Every premium figure is either a real regulatory rate cited inline in the
code (with its source directive), or an explicitly-labeled invented
placeholder where no public rate table exists — see the comments in
`src/App.jsx` for exactly which is which, product by product. Placeholder
premiums are marked **indicative** on the comparison screen, on the quote,
and in the cover note PDF.

## How insurers are compared

Nepal tariffs most non-life lines. On motor, accident and marine the
Authority sets the rate and every insurer quotes it, so on those products
the app deliberately shows the same premium for everyone and points the
comparison at claim settlement instead — a per-insurer price multiplier
would be inventing a difference the market does not have.

Where an insurer does list its own rate for a line, that rate is used, and
real spreads appear: commercial fire runs Rs 0.4 to Rs 1.0 per 1,000
(a 2.5x difference on the same cover) and aviation Rs 0.75 to Rs 5.0.

Availability, listed rates and claim ratios come from one secondary source
— BFIS Compare's non-life listings, read 18 Sep 2026 — which states its own
premium figures are illustrative. None of it is confirmed against the
insurers' own filings with the Authority.

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
