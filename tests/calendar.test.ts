import { test } from "node:test";
import assert from "node:assert/strict";
import { calendar, type Fixture } from "../src/lib/fixtures";
const match: Fixture = { id: 42, date: "2026-11-01T19:00:00Z", confirmed: true, competition: "League; test, test\nNew line", home: { id: 81, name: "FC Barcelona" }, away: { id: 86, name: "Real Madrid" } };

test("exports UTC times, stable IDs and an estimated two-hour event", () => {
  const ics = calendar([match]);
  assert.ok(ics.includes("DTSTART:20261101T190000Z\r\n"));
  assert.ok(ics.includes("DTEND:20261101T210000Z\r\n"));
  assert.ok(ics.includes("UID:42@fixtures.local\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(ics.includes("League\\; test\\, test\\nNew line"));
});
test("does not export fixtures with unconfirmed kickoff times", () => {
  assert.ok(!calendar([{ ...match, confirmed: false }]).includes("BEGIN:VEVENT"));
});
test("folds Unicode content at 75 octets without corrupting characters", () => {
  const ics = calendar([{ ...match, home: { id: 81, name: "á⚽".repeat(80) } }]);
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
  assert.ok(ics.replace(/\r\n /g, "").includes("á⚽".repeat(80)));
});
test("labels demonstration events and gives them separate IDs", () => {
  const ics = calendar([match], true);
  assert.ok(ics.includes("SUMMARY:[DEMO]"));
  assert.ok(ics.includes("UID:demo-42@fixtures.local"));
});
