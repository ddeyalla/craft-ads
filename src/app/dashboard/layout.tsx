import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold">
            VibeCode
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Credits: <span className="font-medium text-foreground">10</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pricing">Get More</Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={undefined} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium">User</div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-8 px-4">
        {children}
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} VibeCode Ad Generator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
