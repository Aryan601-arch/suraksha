// NRB Forex API — https://www.nrb.org.np/api/forex/v1/rates
//   GET params: page, per_page, from (Y-m-d), to (Y-m-d)
//   200 response shape: { status: { code }, data: { payload: [
//     { date, published_on, modified_on, rates: [
//       { currency: { unit, name, ISO3 }, buy, sell }
//     ] }
//   ] }, pagination: {...} }
//   400 response shape: { status: { code: 400 }, errors: { validation: {...} }, data: { payload: null } }
//
// Uses NRB's SELL rate specifically, not a buy/sell midpoint.
//
// Returns { status: "success", rate, date, currency } or { status: "error", ... }
// instead of throwing: the caller's job is to fall back to manual entry, not to
// handle an exception.
export async function fetchNrbRate(currencyIso3 = "USD", fetchImpl = fetch) {
  try {
    // Query the last 10 days, not just today — NRB doesn't publish a rate every
    // calendar day (weekends/holidays), so a same-day-only query regularly comes
    // back empty. We then take the most recently *published* day in that window
    // rather than assuming payload[0] is it.
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 10);
    const fmt = (d) => d.toISOString().slice(0, 10); // Y-m-d
    const url = `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=10&from=${fmt(from)}&to=${fmt(to)}`;
    const res = await fetchImpl(url);
    const data = await res.json();

    if (data?.status?.code !== 200) {
      const validationErrors = data?.errors?.validation;
      throw new Error(validationErrors ? JSON.stringify(validationErrors) : `NRB API returned status ${data?.status?.code}`);
    }

    const payload = data?.data?.payload ?? [];
    if (payload.length === 0) throw new Error("No rates published in the queried date range");
    const latestDay = payload.reduce((latest, day) => (day.date > latest.date ? day : latest), payload[0]);

    const currencyRate = latestDay.rates?.find(
      (r) => (r.currency?.ISO3 ?? r.currency?.iso3)?.toUpperCase() === currencyIso3.toUpperCase()
    );
    if (!currencyRate) throw new Error(`${currencyIso3} not found in NRB response`);

    return { status: "success", rate: parseFloat(currencyRate.sell), date: latestDay.date, currency: currencyIso3 };
  } catch (e) {
    // Likely a CORS restriction from NRB's server on browser-based requests, or
    // the API being unreachable — either way the caller falls back to manual
    // entry rather than blocking the quote.
    return { status: "error", rate: null, date: null, currency: currencyIso3 };
  }
}
