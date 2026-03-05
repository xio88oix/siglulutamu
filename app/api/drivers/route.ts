import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  const drivers = db.prepare("SELECT * FROM drivers ORDER BY name ASC").all();
  return NextResponse.json(drivers);
}
