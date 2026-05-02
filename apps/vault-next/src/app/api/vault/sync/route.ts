import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const vault = await prisma.vault.findUnique({ where: { userId } });
    if (!vault) return NextResponse.json({ vaultPayload: null });

    const payload = typeof vault.encrypted === "string" 
      ? JSON.parse(vault.encrypted) 
      : vault.encrypted;

    return NextResponse.json({ vaultPayload: payload });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { vaultPayload } = await req.json();
    const existing = await prisma.vault.findUnique({ where: { userId } });
    
    if (existing && existing.encrypted) {
      const cloudVault = typeof existing.encrypted === "string" 
        ? JSON.parse(existing.encrypted) 
        : existing.encrypted;
        
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
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
