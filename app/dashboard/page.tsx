import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be signed in to view this page.</p>
            <Button asChild className="mt-4">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  const isFirstLogin = user && !user.isOnboarded;

  if (isFirstLogin) {
    // Update the user's isOnboarded status
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isOnboarded: true },
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Dashboard, {session.user?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {isFirstLogin ? (
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Let's get started!
              </h2>
              <p className="mb-4">
                Connect your music accounts to get the most out of Music Hub.
              </p>
              {/* Add buttons or links to connect different music services */}
              <Button>Connect Spotify</Button>
              <Button className="ml-2">Connect Apple Music</Button>
            </div>
          ) : (
            <div>
              <p className="mb-4">
                Here's an overview of your connected accounts and playlists.
              </p>
              {/* Add dashboard content here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
