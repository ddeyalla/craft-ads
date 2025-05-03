"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Image,
  Video,
  Users,
  Package,
  Grid2X2,
  Phone,
  MessageCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutGrid,
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
    href: "/dashboard/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-background border-r">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-8">
          <div className="relative w-8 h-8 mr-3 bg-black rounded-md flex items-center justify-center">
            <span className="text-white font-medium">C</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">Craft</span>
            <span className="text-xs text-muted-foreground">Project 01</span>
          </div>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md transition",
                pathname === route.href
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn(
                  "h-5 w-5 mr-3",
                  pathname === route.href
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="space-y-1">
          {supportRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              target={route.external ? "_blank" : undefined}
              rel={route.external ? "noopener noreferrer" : undefined}
              className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md transition text-muted-foreground"
            >
              <div className="flex items-center flex-1">
                <route.icon className="h-5 w-5 mr-3" />
                {route.label}
              </div>
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
      <div className="px-3 py-2 mt-auto">
        <div className="flex items-center p-2 mt-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-stone-200 rounded-full overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-xs font-medium bg-accent">
                D
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">devyalla</span>
              <span className="text-xs text-muted-foreground">devyalla@gmail.ai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
