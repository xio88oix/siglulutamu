import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const raceId = searchParams.get("raceId");
  const userId = searchParams.get("userId") || session.id.toString();

  if (!raceId) return NextResponse.json({ error: "raceId required" }, { status: 400 });

  const rp = db.prepare("SELECT * FROM race_picks WHERE user_id = ? AND race_id = ?").get(userId, raceId) as {
    id: number; user_id: number; race_id: number; points: number;
  } | undefined;

  if (!rp) return NextResponse.json(null);

  const picks = db.prepare(
    "SELECT p.id, p.driver_id, d.name, d.team FROM picks p JOIN drivers d ON d.id = p.driver_id WHERE p.race_picks_id = ?"
  ).all(rp.id);

  return NextResponse.json({ ...rp, picks });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { raceId, driverIds, propagate, overlay } = await req.json() as {
    raceId: number;
    driverIds: number[];
    propagate: boolean;
    overlay: boolean;
  };

  if (!raceId || !driverIds || driverIds.length !== 3) {
    return NextResponse.json({ error: "raceId and 3 driverIds required" }, { status: 400 });
  }

  // Check race is open
  const race = db.prepare("SELECT * FROM races WHERE id = ? AND status = 'open'").get(raceId) as {
    id: number; round: number;
  } | undefined;
  if (!race) return NextResponse.json({ error: "Race not found or closed" }, { status: 400 });

  const savePicksForRace = db.transaction((rid: number) => {
    const existing = db.prepare("SELECT id FROM race_picks WHERE user_id = ? AND race_id = ?").get(session.id, rid) as { id: number } | undefined;
    if (existing) {
      db.prepare("DELETE FROM picks WHERE race_picks_id = ?").run(existing.id);
      db.prepare("UPDATE race_picks SET points = 0 WHERE id = ?").run(existing.id);
      const insertPick = db.prepare("INSERT INTO picks (race_picks_id, driver_id) VALUES (?, ?)");
      for (const dId of driverIds) insertPick.run(existing.id, dId);
    } else {
      const rp = db.prepare("INSERT INTO race_picks (user_id, race_id, points) VALUES (?, ?, 0)").run(session.id, rid);
      const insertPick = db.prepare("INSERT INTO picks (race_picks_id, driver_id) VALUES (?, ?)");
      for (const dId of driverIds) insertPick.run(rp.lastInsertRowid, dId);
    }
  });

  savePicksForRace(raceId);

  if (propagate) {
    // Get remaining open races with higher round number
    const remainingRaces = db.prepare(
      "SELECT r.id FROM races r WHERE r.status = 'open' AND r.round > (SELECT round FROM races WHERE id = ?) ORDER BY r.round ASC"
    ).all(raceId) as { id: number }[];

    for (const { id: rid } of remainingRaces) {
      const existingPick = db.prepare("SELECT id FROM race_picks WHERE user_id = ? AND race_id = ?").get(session.id, rid);
      if (!existingPick || overlay) {
        savePicksForRace(rid);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
