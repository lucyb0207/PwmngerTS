import { NextResponse } from "next/server";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { AuthError } from "@pwmnger/errors";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, authHash, kdfSalt } = await req.json();
    console.log("API: Registering user:", email);
    const serverHash = await argon2.hash(authHash);
    console.log("API: Password hashed, saving to DB...");

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: serverHash,
        kdfSalt: JSON.stringify(kdfSalt),
      },
    });
    console.log("API: User created, ID:", user.id);

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });

    const refreshTokenString = crypto.randomBytes(40).toString("hex");
    console.log("API: Saving refresh token...");
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    console.log("API: Registration complete.");

    const response = NextResponse.json({ 
      success: true, 
      accessToken,
      refreshToken: refreshTokenString
    });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutes in seconds
    });

    response.cookies.set("refreshToken", refreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (err: any) {
    logger.error(err, "Registration error");
    if (err.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
