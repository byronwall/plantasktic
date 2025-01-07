import Link from "next/link";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-bold">
            Task Manager
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user.name}
              </span>
              <Button variant="outline" asChild>
                <Link href="/api/auth/signout">Sign out</Link>
              </Button>
            </div>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/api/auth/signin">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
