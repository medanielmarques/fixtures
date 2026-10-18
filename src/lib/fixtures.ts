export type Fixture = {
  id: number;
  date: string;
  confirmed: boolean;
  competition: string;
  home: { id: number; name: string };
  away: { id: number; name: string };
};
export const BARCELONA = 81;
// Editorial preset; users can customize with the opponents filter.
export const BIG_TEAMS = [86, 78, 77, 90, 65, 64, 57, 61, 66, 5];
export function opponent(match: Fixture) {
  return match.home.id === BARCELONA ? match.away : match.home;
}
const escapeText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// RFC 5545: fold content lines at 75 octets, preserving UTF-8 characters.
function fold(line: string) {
  const parts: string[] = [];
  let part = "";
  let bytes = 0;
  for (const char of line) {
    const length = new TextEncoder().encode(char).length;
    if (bytes + length > 75) { parts.push(part); part = " "; bytes = 1; }
    part += char; bytes += length;
  }
  parts.push(part);
  return parts.join("\r\n");
}
export function calendar(matches: Fixture[], demo = false) {
  const now = stamp(new Date());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Fixtures//Barcelona//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${demo ? "DEMO - " : ""}Barcelona`];
  for (const match of matches) {
    if (!match.confirmed) continue;
    const start = new Date(match.date);
    lines.push("BEGIN:VEVENT", `UID:${demo ? "demo-" : ""}${match.id}@fixtures.local`, `DTSTAMP:${now}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 120 * 60000))}`, `SUMMARY:${escapeText(`${demo ? "[DEMO] " : ""}${match.home.name} x ${match.away.name}`)}`, `DESCRIPTION:${escapeText(`${match.competition}. Estimated duration: 2 hours. No automatic updates.${demo ? " Fictional demo match." : ""}`)}`, "END:VEVENT");
  }
  return [...lines, "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}
export function demoFixtures(): Fixture[] {
  const teams = [{ id: 86, name: "Real Madrid" }, { id: 92, name: "Real Sociedad" }, { id: 78, name: "Atlético de Madrid" }, { id: 5, name: "Bayern München" }, { id: 95, name: "Valencia" }, { id: 77, name: "Athletic Club" }];
  return teams.map((team, index) => {
    const date = new Date(); date.setUTCDate(date.getUTCDate() + 7 * (index + 1)); date.setUTCHours(19, 0, 0, 0);
    const barca = { id: BARCELONA, name: "FC Barcelona" };
    return { id: index + 1, date: date.toISOString(), confirmed: index !== 5, competition: index === 3 ? "Champions League" : "La Liga", home: index % 2 ? team : barca, away: index % 2 ? barca : team };
  });
}
