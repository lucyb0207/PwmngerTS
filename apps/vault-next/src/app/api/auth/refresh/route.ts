import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const refreshTokenString = cookieStore.get("refreshToken")?.value;

  if (!refreshTokenString) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    const accessToken = jwt.sign(
      { userId: tokenRecord.userId },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const response = NextResponse.json({ success: true, accessToken });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
