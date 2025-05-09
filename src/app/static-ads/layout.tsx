import { ReactNode } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";


interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-full relative">

      <main className="h-full">
        {children}
      </main>
    </div>
  );
}
