import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vault = await prisma.vault.findUnique({ where: { userId: session.userId } });
  if (!vault) return NextResponse.json({ vaultPayload: null });

  const payload =
    typeof vault.encrypted === "string"
      ? JSON.parse(vault.encrypted)
      : vault.encrypted;

  return NextResponse.json({ vaultPayload: payload });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vaultPayload } = await req.json();
  const userId = session.userId;

  const existing = await prisma.vault.findUnique({ where: { userId } });

  if (existing && existing.encrypted) {
    let cloudVault: any;
    try {
      cloudVault =
        typeof existing.encrypted === "string"
          ? JSON.parse(existing.encrypted)
          : existing.encrypted;
    } catch {
      cloudVault = {};
    }

    const cloudUpdatedAt = cloudVault.updatedAt || 0;
    const clientUpdatedAt = vaultPayload.updatedAt || 0;

    if (cloudUpdatedAt > clientUpdatedAt) {
      return NextResponse.json({ error: "Cloud version is newer than client version" }, { status: 409 });
    }
  }

  const encryptedString = JSON.stringify(vaultPayload);

  await prisma.vault.upsert({
    where: { userId },
    update: { encrypted: encryptedString },
    create: { encrypted: encryptedString, userId },
  });

  return NextResponse.json({ success: true });
}
