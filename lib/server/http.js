// Small helpers shared by the API routes.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export function errorResponse(err) {
  if (err instanceof HttpError) return json({ error: err.message }, err.status);
  console.error("API error:", err);
  return json({ error: "Something went wrong on the server. Please try again." }, 500);
}

// The public address of the site (needed for the SSLCommerz return URLs).
// Set SITE_URL in the environment to force it; otherwise it is read from the request.
export function siteOrigin(request) {
  const forced = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (forced) return forced.replace(/\/+$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}
