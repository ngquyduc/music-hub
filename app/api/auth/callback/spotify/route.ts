import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

async function getSpotifyToken(code: string) {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  });

  return response.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Get the base URL for redirects
  const baseUrl =
    process.env.NEXTAUTH_URL || `https://${request.headers.get("host")}`;

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=spotify_auth_failed`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=spotify_code_missing`
    );
  }

  try {
    const tokenData = await getSpotifyToken(code);

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.redirect(`${baseUrl}/dashboard?error=no_session`);
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token,
        spotifyTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });

    return NextResponse.redirect(
      `${baseUrl}/dashboard?success=spotify_connected`
    );
  } catch (error) {
    console.error("Error in Spotify callback:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?error=spotify_token_error`
    );
  }
}
