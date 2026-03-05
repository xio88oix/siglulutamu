import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { position } = await req.json();
  const existing = db.prepare("SELECT race_id FROM race_results WHERE id = ?").get(id) as { race_id: number } | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.prepare("UPDATE race_results SET position = ? WHERE id = ?").run(position, id);
  // Recalc points
  recalcPoints(db, existing.race_id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const existing = db.prepare("SELECT race_id FROM race_results WHERE id = ?").get(id) as { race_id: number } | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.prepare("DELETE FROM race_results WHERE id = ?").run(id);
  recalcPoints(db, existing.race_id);
  return NextResponse.json({ ok: true });
}

function recalcPoints(db: ReturnType<typeof getDb>, raceId: number) {
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
