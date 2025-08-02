import ScanningActivityFeed from "@/components/ScanningActivityFeed";

// app/dashboard/page.tsx
export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
      <ScanningActivityFeed />
    </div>
  );
}
