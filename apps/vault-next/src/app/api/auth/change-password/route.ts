import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as argon2 from "argon2";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await getAuthUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { oldAuthHash, newAuthHash, newKdfSalt } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isValid = await argon2.verify(user.passwordHash, oldAuthHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid old password" }, { status: 400 });
    }

    const newServerHash = await argon2.hash(newAuthHash);
    const updateData: any = { passwordHash: newServerHash };
    if (newKdfSalt) {
      updateData.kdfSalt = JSON.stringify(newKdfSalt);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
