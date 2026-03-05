import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM position_points ORDER BY finishing_place ASC").all());
}

export async function PUT(req: NextRequest) {
  const db = getDb();
  const updates = await req.json() as { id: number; finishing_place: number; points: number }[];
  const update = db.prepare("UPDATE position_points SET points = ? WHERE finishing_place = ?");
  const transaction = db.transaction(() => {
    for (const { finishing_place, points } of updates) {
      update.run(points, finishing_place);
    }
  });
  transaction();
  return NextResponse.json({ ok: true });
}
