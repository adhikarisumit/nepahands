import "server-only";
import crypto from "crypto";

const apiBase = () =>
  process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

export async function paddleRequest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (!process.env.PADDLE_API_KEY) throw new Error("PADDLE_API_KEY is not set");
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    const detail = json?.error?.detail || json?.error?.code || res.statusText;
    throw new Error(`Paddle: ${detail}`);
  }
  return json;
}

/**
 * Verifies the `Paddle-Signature` header: "ts=<unix>;h1=<hmac-sha256(ts:rawBody)>".
 */
export function verifyPaddleSignature(rawBody: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(";").map((kv) => {
      const [k, ...v] = kv.split("=");
      return [k.trim(), v.join("=").trim()];
    })
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > toleranceSec) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(h1, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
