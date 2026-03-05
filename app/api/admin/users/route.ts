import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  const users = db.prepare("SELECT id, name, is_admin FROM users ORDER BY name ASC").all();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { name, password, isAdmin } = await req.json();
  if (!name || !password) return NextResponse.json({ error: "Name and password required" }, { status: 400 });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare("INSERT INTO users (name, password, is_admin) VALUES (?, ?, ?)").run(name, hash, isAdmin ? 1 : 0);
    return NextResponse.json({ id: result.lastInsertRowid, name, isAdmin: !!isAdmin });
  } catch {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
}
