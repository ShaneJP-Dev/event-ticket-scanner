"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // shadcn/ui helper
import { Calendar, Ticket, LayoutDashboard } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Events", href: "/dashboard/events", icon: Calendar },
    { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-48 bg-muted border-r flex flex-col p-4">
      {/* Title at the top */}
      <h2 className="text-xl font-bold mb-6">Event Help</h2>
      
      {/* Navigation links */}
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "p-2 rounded hover:bg-primary/10 flex items-center gap-2 transition-colors",
              pathname === link.href && "bg-primary text-primary-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
