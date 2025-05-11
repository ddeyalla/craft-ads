"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Image,
  Video,
  Users,
  Package,
  Grid2X2,
  Phone,
  MessageCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const routes = [
  {
    label: "Home",
    icon: Home,
    href: "/dashboard",
    color: "text-slate-500",
  },
  {
    label: "Static Ads",
    icon: Image,
    href: "/static-ads",
    color: "text-slate-500",
  },
  {
    label: "Audience",
    icon: Users,
    href: "/audience",
    color: "text-slate-500",
  },
  {
    label: "Products",
    icon: Package,
    href: "/products",
    color: "text-slate-500",
  },
  {
    label: "Ad gallery",
    icon: Grid2X2,
    href: "/ad-gallery",
    color: "text-slate-500",
  },
];

const supportRoutes = [
  {
    label: "Book a call",
    icon: Phone,
    href: "https://cal.com/divyanshu-playjump/20-min-meeting",
    external: true,
  },
  {
    label: "Feedback",
    icon: MessageCircle,
    href: "/dashboard/feedback",
  },
  {
    label: "Live chat",
    icon: MessageCircle,
    href: "/dashboard/chat",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

interface MainSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function MainSidebar({ open, setOpen }: MainSidebarProps) {
  const { user, profile, isLoading: authLoading } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      <div
        className={
          cn(
            "fixed inset-0 bg-black bg-opacity-40 z-30 transition-opacity sm:hidden",
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )
        }
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <aside
        className={
          cn(
            "fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-background/95 border-r flex flex-col px-4 py-6",
            open ? "translate-x-0" : "-translate-x-full",
            "sm:translate-x-0 sm:block"
          )
        }
        aria-label="Sidebar"
      >
        {/* Close button for mobile */}
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute top-2 right-2 p-2 rounded-md text-muted-foreground hover:bg-accent focus:outline-none sm:hidden"
          onClick={() => setOpen(false)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col flex-1">
          <Link href="/dashboard" className="flex items-center mb-6 border-b pb-4">
            <div className="relative w-8 h-8 mr-3 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-medium">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">Craft</span>
              <span className="text-xs text-muted-foreground">Project 01</span>
            </div>
          </Link>
          <nav className="flex-1 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-md transition font-medium text-sm",
                  pathname === route.href
                    ? "bg-accent text-accent-foreground font-semibold border-l-4 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <route.icon className={cn(
                  "h-5 w-5",
                  pathname === route.href
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )} />
                {route.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t pt-4 space-y-1">
            {supportRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                target={route.external ? "_blank" : undefined}
                rel={route.external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="p-3 rounded-md border flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">10 Credits</span>
              <Button variant="link" className="text-xs px-0 font-normal h-auto p-0">
                Upgrade
              </Button>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="w-1/4 h-full bg-primary rounded-full" />
            </div>
          </div>
        </div>
        <div className="mt-auto border-t pt-4 flex items-center gap-2 bg-background/95">
          {authLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ) : profile ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.full_name?.substring(0, 1) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{profile?.username || 'User'}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-stone-200 rounded-full overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-xs font-medium bg-accent">
                  ?</div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Guest</span>
                <span className="text-xs text-muted-foreground">Not signed in</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
