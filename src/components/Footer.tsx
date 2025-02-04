import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Image
              src="/favicon.ico"
              alt="Plan Task Tic Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-sm text-muted-foreground">Plan·Task·Tic</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Created by{" "}
            <Link
              href="https://byroni.us"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Byron Wall
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
