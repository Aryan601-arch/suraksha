// Policy numbers used to be built with a hardcoded "SICL-" prefix for all 14
// insurers, so a policy bought from Oriental came back numbered as if Shikhar
// had issued it. The prefix is the issuing insurer's own code, and this lives
// in its own module so that stays true however the screens get rearranged.
export function makePolicyNumber(product, insurer, issuedAt = new Date(), serial = randomSerial()) {
  const productCode = product.id.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6);
  return `${insurer.code}-${productCode}-${issuedAt.getFullYear()}-${serial}`;
}

export function randomSerial() {
  return String(Math.floor(Math.random() * 90000) + 10000);
}
