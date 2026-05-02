import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { email: true, twoFactorSecret: true, kdfSalt: true }
    });
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      email: user.email,
      is2FAEnabled: !!user.twoFactorSecret,
      kdfSalt: user.kdfSalt ? JSON.parse(user.kdfSalt) : null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
