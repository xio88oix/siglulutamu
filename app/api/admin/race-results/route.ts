import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const raceId = searchParams.get("raceId");
  if (!raceId) return NextResponse.json({ error: "raceId required" }, { status: 400 });
  const results = db.prepare(`
    SELECT rr.id, rr.race_id, rr.driver_id, rr.position, d.name as driver_name, d.team
    FROM race_results rr
    JOIN drivers d ON d.id = rr.driver_id
    WHERE rr.race_id = ?
    ORDER BY rr.position ASC
  `).all(raceId);
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { raceId, driverId, position } = await req.json();
  if (!raceId || !driverId || !position) return NextResponse.json({ error: "raceId, driverId, position required" }, { status: 400 });
  try {
    const result = db.prepare("INSERT INTO race_results (race_id, driver_id, position) VALUES (?, ?, ?)").run(raceId, driverId, position);
    // Recalculate points for all picks for this race
    recalcPoints(db, raceId);
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Duplicate result entry" }, { status: 409 });
  }
}

function recalcPoints(db: ReturnType<typeof getDb>, raceId: number | string) {
  const racePicks = db.prepare("SELECT id FROM race_picks WHERE race_id = ?").all(raceId) as { id: number }[];
  for (const rp of racePicks) {
    const picks = db.prepare("SELECT driver_id FROM picks WHERE race_picks_id = ?").all(rp.id) as { driver_id: number }[];
    let total = 0;
    for (const pick of picks) {
      const result = db.prepare(`
        SELECT pp.points FROM race_results rr
        JOIN position_points pp ON pp.finishing_place = rr.position
        WHERE rr.race_id = ? AND rr.driver_id = ?
      `).get(raceId, pick.driver_id) as { points: number } | undefined;
      if (result) total += result.points;
    }
    db.prepare("UPDATE race_picks SET points = ? WHERE id = ?").run(total, rp.id);
  }
}
