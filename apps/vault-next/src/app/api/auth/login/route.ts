import { NextResponse } from "next/server";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, authHash, twoFactorToken } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`Login Failed: User not found for email ${email}`);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    console.log(`DEBUG: Received authHash from client: ${authHash}`);

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, authHash);
    if (!isValid) {
      console.log(`Login Failed: Password mismatch for email ${email}. Hash in DB: ${user.passwordHash}`);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check 2FA if enabled
    if (user.twoFactorSecret) {
      if (!twoFactorToken) {
        return NextResponse.json({ requires2FA: true }, { status: 401 });
      }
      
      const otplib = await import("otplib");
      const totp = new otplib.TOTP({
        crypto: new otplib.NobleCryptoPlugin(),
        base32: new otplib.ScureBase32Plugin()
      });
      const isValid2FA = await totp.verify(twoFactorToken, { secret: user.twoFactorSecret });
      
      if (!isValid2FA) {
        return NextResponse.json({ error: "Invalid 2FA token" }, { status: 401 });
      }
    }

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });

    const refreshTokenString = crypto.randomBytes(40).toString("hex");
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const response = NextResponse.json({ 
      success: true, 
      accessToken,
      refreshToken: refreshTokenString
    });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
    });

    response.cookies.set("refreshToken", refreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
