import { NextResponse } from "next/server";
import { BARCELONA, type Fixture, type Team } from "@/lib/fixtures";

type ApiMatch = { id: number; utcDate: string | null; status: string; competition: { name: string }; homeTeam: Team; awayTeam: Team };
export async function GET() {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) return NextResponse.json({ error: "Match data is not configured. Try the demo or contact the site owner.", setup: true }, { status: 503 });
  try {
    const response = await fetch(`https://api.football-data.org/v4/teams/${BARCELONA}/matches?status=SCHEDULED,TIMED&limit=100`, { headers: { "X-Auth-Token": token }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) return NextResponse.json({ error: response.status === 429 ? "Too many requests. Try again in a few minutes." : "Match data is unavailable. Please try again later." }, { status: 502 });
    const data = await response.json();
    if (!Array.isArray(data.matches)) throw new Error("Invalid response");
    const fixtures: Fixture[] = (data.matches as ApiMatch[]).filter(m => m.utcDate && (m.homeTeam.id === BARCELONA || m.awayTeam.id === BARCELONA) && new Date(m.utcDate).getTime() > Date.now()).map(m => ({ id: m.id, date: m.utcDate!, confirmed: m.status === "TIMED", competition: m.competition.name, home: m.homeTeam, away: m.awayTeam })).sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json({ fixtures, fetchedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Match data is unavailable. Please try again." }, { status: 502 });
  }
}
