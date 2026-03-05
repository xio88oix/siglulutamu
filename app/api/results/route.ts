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

  const picks = db.prepare(`
    SELECT p.id, p.driver_id, d.name, d.team,
      rr.position,
      pp.points as earned_points
    FROM picks p
    JOIN drivers d ON d.id = p.driver_id
    LEFT JOIN race_results rr ON rr.race_id = ? AND rr.driver_id = p.driver_id
    LEFT JOIN position_points pp ON pp.finishing_place = rr.position
    WHERE p.race_picks_id = ?
  `).all(raceId, rp.id);

  return NextResponse.json({ ...rp, picks });
}
