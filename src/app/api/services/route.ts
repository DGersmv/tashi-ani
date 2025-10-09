import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "public/pdf-pages");

  let images: string[] = [];
  try {
    const files = fs.readdirSync(dir);
    images = files.filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  } catch {
    images = [];
  }

  return NextResponse.json({ images });
}
