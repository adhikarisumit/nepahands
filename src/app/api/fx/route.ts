import { NextResponse } from "next/server";
import { getLiveRate } from "@/lib/fx";
import { CURRENCY } from "@/lib/utils";

const DISPLAY = ["USD"];

/** Exchange rates for showing prices in other currencies (display only — checkout is in the store currency). */
export async function GET() {
  const rates: Record<string, number> = {};
  let asOf: string | null = null;
  for (const code of DISPLAY) {
    if (code === CURRENCY) continue;
    const live = await getLiveRate(code);
    if (live) {
      rates[code] = live.rate;
      asOf = live.asOf;
    }
  }
  if (!Object.keys(rates).length) return NextResponse.json({ error: "Exchange rates unavailable" }, { status: 503 });
  return NextResponse.json({ base: CURRENCY, rates, asOf }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
