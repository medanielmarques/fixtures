"use client";

import { useEffect, useState } from "react";
import { BIG_TEAMS, calendar, demoFixtures, opponent, type Fixture } from "@/lib/fixtures";

type Mode = "all" | "big" | "opponents";
export default function Home() {
  const [matches, setMatches] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [competition, setCompetition] = useState("all");
  const [mode, setMode] = useState<Mode>("all");
  const [opponents, setOpponents] = useState<number[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [timezone, setTimezone] = useState("UTC");

  async function load() {
    setLoading(true); setError(""); setNotice(""); setDemo(false); setMatches([]);
    try {
      const response = await fetch("/api/fixtures");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load matches.");
      setMatches(data.fixtures);
    } catch (e) { setError(e instanceof Error ? e.message : "Connection failed."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const timer = setTimeout(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    try {
      const saved = JSON.parse(localStorage.getItem("barcelona-filters-v1") || "null");
      if (saved) {
        if (["all", "big", "opponents"].includes(saved.mode)) setMode(saved.mode);
        if (typeof saved.competition === "string") setCompetition(saved.competition);
        if (Array.isArray(saved.opponents)) setOpponents(saved.opponents.filter((id: unknown) => typeof id === "number"));
        if (Array.isArray(saved.excluded)) setExcluded(saved.excluded.filter((id: unknown) => typeof id === "number"));
      }
    } catch { /* Storage can be unavailable. */ }
    setReady(true);
    void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready || demo) return;
    try { localStorage.setItem("barcelona-filters-v1", JSON.stringify({ mode, competition, opponents, excluded })); } catch { /* Filtering still works without persistence. */ }
  }, [ready, demo, mode, competition, opponents, excluded]);

  const competitions = [...new Set(matches.map(m => m.competition))];
  const teams = [...new Map(matches.map(m => [opponent(m).id, opponent(m)])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = matches.filter(m => (competition === "all" || m.competition === competition) && (mode === "all" || (mode === "big" ? BIG_TEAMS : opponents).includes(opponent(m).id)));
  const selected = filtered.filter(m => m.confirmed && !excluded.includes(m.id));
  const toggle = (id: number) => { setNotice(""); setExcluded(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); };
  function download() {
    if (!selected.length) return;
    const url = URL.createObjectURL(new Blob([calendar(selected, demo)], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = demo ? "barcelona-demo.ics" : "barcelona.ics";
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Calendar downloaded. Import the .ics file into your calendar app.");
  }
  const selectClass = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-neutral-800";
  const selectable = filtered.filter(match => match.confirmed);
  const allSelected = selectable.length > 0 && selected.length === selectable.length;
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold text-neutral-500">Fixtures</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Barcelona matches</h1>
        <p className="mt-2 text-sm text-neutral-600">Select matches and export them to your calendar.</p>
      </header>

      {demo && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>Demo data. Matches and dates are fictional.</p>
          <button className="underline underline-offset-4" onClick={load}>Load real matches</button>
        </div>
      )}

      <section aria-label="Filters" className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Competition
            <select className={selectClass} value={competition} onChange={e => { setCompetition(e.target.value); setNotice(""); }}>
              <option value="all">All competitions</option>
              {competitions.map(c => <option key={c}>{c}</option>)}
              {competition !== "all" && !competitions.includes(competition) && <option value={competition}>{competition}</option>}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Opponents
            <select className={selectClass} value={mode} onChange={e => { setMode(e.target.value as Mode); setNotice(""); }}>
              <option value="all">All opponents</option>
              <option value="big">Big teams</option>
              <option value="opponents">Choose opponents</option>
            </select>
          </label>
        </div>
        {mode === "big" && <p className="mt-3 text-xs text-neutral-500">Preset list. Use “Choose opponents” to customize.</p>}
        {mode === "opponents" && (
          <fieldset className="mt-4 flex max-h-48 flex-wrap gap-x-5 gap-y-3 overflow-auto border-t border-neutral-100 pt-4">
            <legend className="sr-only">Choose opponents</legend>
            {teams.map(team => (
              <label key={team.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={opponents.includes(team.id)} onChange={() => { setNotice(""); setOpponents(current => current.includes(team.id) ? current.filter(id => id !== team.id) : [...current, team.id]); }} className="size-4 accent-neutral-900" />
                {team.name}
              </label>
            ))}
            {!teams.length && <p className="text-sm text-neutral-500">Load matches to choose opponents.</p>}
          </fieldset>
        )}
      </section>

      <section aria-label="Barcelona matches" aria-busy={loading} className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <h2 className="font-medium">Upcoming matches <span className="text-neutral-500">({filtered.length})</span></h2>
          <span className="text-xs text-neutral-500">Times in {timezone}</span>
        </div>
        {loading ? (
          <div role="status" className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">Loading matches…</div>
        ) : error ? (
          <div role="alert" className="rounded-lg border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-medium">Could not load matches</h3>
            <p className="mt-2 text-sm text-neutral-600">{error}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button onClick={load} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">Retry</button>
              <button onClick={() => { setDemo(true); setError(""); setCompetition("all"); setMode("all"); setOpponents([]); setExcluded([]); setMatches(demoFixtures()); }} className="text-sm underline underline-offset-4">Try demo</button>
            </div>
          </div>
        ) : !filtered.length ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            {matches.length ? "No matches for these filters." : "No upcoming matches available."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <label className="inline-flex cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" checked={allSelected} disabled={!selectable.length} onChange={() => { const ids = selectable.map(m => m.id); setExcluded(current => allSelected ? [...new Set([...current, ...ids])] : current.filter(id => !ids.includes(id))); setNotice(""); }} className="size-4 accent-neutral-900" />
                Select all
              </label>
            </div>
            {filtered.map(match => (
              <label key={match.id} className={`flex items-start gap-3 border-b border-neutral-100 px-4 py-4 last:border-b-0 sm:items-center ${match.confirmed ? "cursor-pointer hover:bg-neutral-50" : "text-neutral-500"}`}>
                <input type="checkbox" aria-label={`Select ${match.home.name} vs ${match.away.name}`} disabled={!match.confirmed} checked={match.confirmed && !excluded.includes(match.id)} onChange={() => toggle(match.id)} className="mt-0.5 size-4 shrink-0 accent-neutral-900 sm:mt-0" />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div>
                    <p className="text-sm font-medium">{match.home.name} <span className="font-normal text-neutral-400">vs</span> {match.away.name}</p>
                    <p className="mt-1 text-xs text-neutral-500">{match.competition} · {match.home.id === 81 ? "Home" : "Away"}</p>
                  </div>
                  <div className="shrink-0 text-xs text-neutral-600 sm:text-right">
                    <p>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", weekday: "short", year: "numeric", ...(match.confirmed ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: timezone }).format(new Date(match.date))}</p>
                    {!match.confirmed && <p className="mt-1 text-neutral-500">Provisional date · Kickoff unconfirmed</p>}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="sticky bottom-0 mt-4 border-t border-neutral-200 bg-[#fafafa]/95 py-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">{selected.length} {selected.length === 1 ? "match selected" : "matches selected"}</p>
            <button disabled={!selected.length || loading} onClick={download} className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40">Export .ics</button>
          </div>
          <p className="mt-3 text-xs text-neutral-500">No automatic updates. Unconfirmed kickoffs are excluded. Events last 2 hours.</p>
          {notice && <p role="status" className="mt-3 text-sm text-neutral-700">{notice}</p>}
        </div>
      </section>
      <footer className="mt-6 text-xs text-neutral-400">Men’s first team · Data: football-data.org</footer>
    </main>
  );
}
