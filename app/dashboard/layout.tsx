import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">{children}
        <Toaster />
      </main>

    </div>
  );
}
