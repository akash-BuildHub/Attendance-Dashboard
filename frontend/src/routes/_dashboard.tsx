import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayoutRoute,
});

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
