import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const vaultCount = await prisma.vault.count();
    
    return NextResponse.json({
      success: true,
      users: 50000 + userCount, // Base numbers + real data
      threats: 1250000 + (vaultCount * 23),
      rating: 99.9
    });
  } catch (error) {
    return NextResponse.json({
      users: 48000,
      threats: 1250000,
      rating: 99.9
    });
  }
}
