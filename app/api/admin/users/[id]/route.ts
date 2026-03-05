import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const { name, password, isAdmin } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET name = ?, password = ?, is_admin = ? WHERE id = ?").run(name, hash, isAdmin ? 1 : 0, id);
  } else {
    db.prepare("UPDATE users SET name = ?, is_admin = ? WHERE id = ?").run(name, isAdmin ? 1 : 0, id);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
