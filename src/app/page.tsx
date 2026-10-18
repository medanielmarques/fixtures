"use client";

import { useEffect, useState } from "react";
import { BIG_TEAMS, calendar, demoFixtures, opponent, type Fixture, type Team } from "@/lib/fixtures";

type Mode = "all" | "big" | "opponents";
function TeamCrest({ team }: { team: Team }) {
  const [failed, setFailed] = useState(false);
  if (!team.crest || failed) {
    return <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">{team.name.split(" ").map(word => word[0]).slice(0, 3).join("")}</span>;
  }
  // Render provider assets directly without requiring a server image proxy.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={team.crest} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="size-8 shrink-0 object-contain" />;
}

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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
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
          <div>
            <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={allSelected} disabled={!selectable.length} onChange={() => { const ids = selectable.map(m => m.id); setExcluded(current => allSelected ? [...new Set([...current, ...ids])] : current.filter(id => !ids.includes(id))); setNotice(""); }} className="size-4 accent-neutral-900" />
              Select all
            </label>
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map(match => (
                <label key={match.id} className={`flex min-w-0 flex-col rounded-lg border bg-white p-4 transition-colors focus-within:ring-2 focus-within:ring-neutral-500 ${!match.confirmed ? "border-dashed border-neutral-200 text-neutral-500" : !excluded.includes(match.id) ? "cursor-pointer border-neutral-400 hover:border-neutral-600" : "cursor-pointer border-neutral-200 hover:border-neutral-400"}`}>
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <p className="min-w-0 text-xs text-neutral-500">{match.competition} · {match.home.id === 81 ? "Home" : "Away"}</p>
                    <input type="checkbox" aria-label={`Select ${match.home.name} vs ${match.away.name}`} disabled={!match.confirmed} checked={match.confirmed && !excluded.includes(match.id)} onChange={() => toggle(match.id)} className="size-4 shrink-0 accent-neutral-900" />
                  </div>
                  <div className="space-y-3">
                    {[match.home, match.away].map(team => (
                      <div key={team.id} className="flex min-w-0 items-center gap-3">
                        <TeamCrest key={`${team.id}-${team.crest}`} team={team} />
                        <span className="min-w-0 text-sm font-medium leading-snug break-words">{team.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="border-t border-neutral-100 pt-3 text-xs text-neutral-600">
                      <p>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", weekday: "short", year: "numeric", ...(match.confirmed ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: timezone }).format(new Date(match.date))}</p>
                      {!match.confirmed && <p className="mt-1 text-neutral-500">Provisional date · Kickoff unconfirmed</p>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
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
    </main>
  );
}
