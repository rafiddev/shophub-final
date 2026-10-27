// Turns the FIREBASE_PRIVATE_KEY environment value into a clean PEM key.
// It accepts every way people usually paste it: with literal \n, with real new lines, all on one line,
// with the END line stuck to the end of the key, or wrapped in quotes.
export function normalizePrivateKey(raw) {
  const text = String(raw || "").trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
  const m = text.match(/-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/);
  if (!m) return text; // not a PEM at all: return as is, the caller reports it
  const body = m[2].replace(/[^A-Za-z0-9+/=]/g, "");
  const lines = body.match(/.{1,64}/g) || [];
  return `-----BEGIN ${m[1]}-----\n${lines.join("\n")}\n-----END ${m[1]}-----\n`;
}