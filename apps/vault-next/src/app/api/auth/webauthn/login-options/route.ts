import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";

const rpID = process.env.RP_ID || "localhost";

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { authenticators: true }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.authenticators.map(auth => ({
      id: auth.credentialID,
      type: "public-key" as const,
    })),
    userVerification: "preferred",
  });

  const response = NextResponse.json(options);
  
  response.cookies.set("webauthn_login_challenge", options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300,
  });
  
  response.cookies.set("webauthn_login_user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300,
  });

  return response;
}
