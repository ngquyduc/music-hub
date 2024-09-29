import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isOnboarded: true,
        spotifyAccessToken: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      isOnboarded: user.isOnboarded,
      isSpotifyConnected: !!user.spotifyAccessToken,
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
