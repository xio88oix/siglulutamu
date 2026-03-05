import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM races ORDER BY round ASC").all());
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { round, name, date, status } = await req.json();
  if (!round || !name || !date) return NextResponse.json({ error: "round, name, and date required" }, { status: 400 });
  const result = db.prepare("INSERT INTO races (round, name, date, status) VALUES (?, ?, ?, ?)").run(round, name, date, status || "open");
  return NextResponse.json({ id: result.lastInsertRowid, round, name, date, status: status || "open" });
}
