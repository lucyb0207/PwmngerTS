import { generateSecret, generateURI, verifySync } from "otplib";
import { toDataURL } from "qrcode";
import { prisma } from "./prisma";

export async function setup2FA(userId: string, email: string) {
  const secret = generateSecret();
  const otpauth = generateURI({
    secret,
    label: email,
    issuer: "PwmngerTS",
  });

  const qrCode = await toDataURL(otpauth);
  return { secret, qrCode };
}

export async function verify2FASetup(userId: string, token: string, secret: string) {
  const isValid = verifySync({ token, secret }).valid;
  if (!isValid) return false;

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return true;
}

export async function verify2FALogin(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) return false;
  return verifySync({ token, secret: user.twoFactorSecret }).valid;
}
