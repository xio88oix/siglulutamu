import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  const leaderboard = db.prepare(`
    SELECT u.id, u.name,
      COALESCE(SUM(rp.points), 0) as total_points,
      COUNT(rp.id) as races_picked
    FROM users u
    LEFT JOIN race_picks rp ON rp.user_id = u.id
    LEFT JOIN races r ON r.id = rp.race_id AND r.status = 'closed'
    WHERE u.is_admin = 0
    GROUP BY u.id, u.name
    ORDER BY total_points DESC, u.name ASC
  `).all();

  return NextResponse.json(
    leaderboard.map((row: unknown, i: number) => ({ rank: i + 1, ...(row as object) }))
  );
}
