import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { kdfSalt: true }
    });

    if (!user || !user.kdfSalt) {
      return NextResponse.json({ error: "User not found or salt missing" }, { status: 404 });
    }

    return NextResponse.json({ kdfSalt: JSON.parse(user.kdfSalt) });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
