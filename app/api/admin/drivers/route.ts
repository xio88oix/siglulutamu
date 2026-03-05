import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM drivers ORDER BY name ASC").all());
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { name, team } = await req.json();
  if (!name || !team) return NextResponse.json({ error: "Name and team required" }, { status: 400 });
  const result = db.prepare("INSERT INTO drivers (name, team) VALUES (?, ?)").run(name, team);
  return NextResponse.json({ id: result.lastInsertRowid, name, team });
}
