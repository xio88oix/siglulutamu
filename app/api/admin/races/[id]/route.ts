import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { round, name, date, status } = await req.json();
  db.prepare("UPDATE races SET round = ?, name = ?, date = ?, status = ? WHERE id = ?").run(round, name, date, status, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM races WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
