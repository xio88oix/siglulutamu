import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  const users = db.prepare("SELECT id, name FROM users WHERE is_admin = 0 ORDER BY name ASC").all();
  return NextResponse.json(users);
}
