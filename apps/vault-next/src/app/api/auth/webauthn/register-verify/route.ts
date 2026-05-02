import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";

const rpID = process.env.RP_ID || "localhost";
const origin = process.env.ORIGIN || `http://localhost:3000`;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get("webauthn_registration_challenge")?.value;

  if (!expectedChallenge) {
    return NextResponse.json({ error: "Registration challenge not found" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential } = registrationInfo;
      const { publicKey, id: credentialID, counter } = credential;

      await prisma.authenticator.create({
        data: {
          credentialID: Buffer.from(credentialID).toString("base64"),
          credentialPublicKey: Buffer.from(publicKey).toString("base64"),
          counter,
          credentialDeviceType: registrationInfo.credentialDeviceType,
          credentialBackedUp: registrationInfo.credentialBackedUp,
          userId: user.id,
        },
      });

      const response = NextResponse.json({ verified: true });
      response.cookies.delete("webauthn_registration_challenge");
      return response;
    } else {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
