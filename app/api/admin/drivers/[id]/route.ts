import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { name, team } = await req.json();
  db.prepare("UPDATE drivers SET name = ?, team = ? WHERE id = ?").run(name, team, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM drivers WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
