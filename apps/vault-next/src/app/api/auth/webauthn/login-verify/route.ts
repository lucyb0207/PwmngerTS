import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";

const rpID = process.env.RP_ID || "localhost";
const origin = process.env.ORIGIN || `http://localhost:3000`;

export async function POST(req: Request) {
  const body = await req.json();
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get("webauthn_login_challenge")?.value;
  const userId = cookieStore.get("webauthn_login_user_id")?.value;

  if (!expectedChallenge || !userId) {
    return NextResponse.json({ error: "Authentication challenge not found" }, { status: 400 });
  }

  const authenticator = await prisma.authenticator.findFirst({
    where: { 
      credentialID: body.id,
      userId: userId
    }
  });

  if (!authenticator) {
    return NextResponse.json({ error: "Authenticator not found" }, { status: 401 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credentialID,
        publicKey: Buffer.from(authenticator.credentialPublicKey, "base64"),
        counter: Number(authenticator.counter),
      },
      requireUserVerification: true,
    });

    const { verified, authenticationInfo } = verification;

    if (verified) {
      await prisma.authenticator.update({
        where: { id: authenticator.id },
        data: { counter: BigInt(authenticationInfo.newCounter) }
      });

      // Issue JWT directly on successful WebAuthn login
      const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
        expiresIn: "15m",
      });

      const refreshTokenString = crypto.randomBytes(40).toString("hex");
      await prisma.refreshToken.create({
        data: {
          token: refreshTokenString,
          userId: userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const response = NextResponse.json({ verified: true, accessToken });
      
      response.cookies.delete("webauthn_login_challenge");
      response.cookies.delete("webauthn_login_user_id");

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
    } else {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
