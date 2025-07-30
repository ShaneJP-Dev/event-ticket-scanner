"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // shadcn/ui helper for class names
import { Calendar, Ticket } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

 const links = [
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
];

  return (
    <aside className="h-screen w-48 border-r bg-muted flex flex-col p-4">
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "p-2 rounded hover:bg-primary/10 transition-colors",
              pathname === link.href && "bg-primary text-primary-foreground"
            )}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
