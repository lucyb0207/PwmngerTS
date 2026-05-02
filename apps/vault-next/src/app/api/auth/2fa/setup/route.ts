import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import * as otplib from "otplib";
import QRCode from "qrcode";

export async function POST(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const totp = new otplib.TOTP({
      crypto: new otplib.NobleCryptoPlugin(),
      base32: new otplib.ScureBase32Plugin()
    });
    
    const secret = totp.generateSecret();
    const otpauth = totp.toURI({ label: user.email, issuer: "PwmngerTS", secret });
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return NextResponse.json({
      secret,
      qrCode: qrCodeUrl
    });
  } catch (error: any) {
    console.error("2FA Setup Error:", error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
