import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/shell";
import { profileQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_app")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(profileQuery);
    if (me && !me.profile?.onboarded) throw redirect({ to: "/onboarding" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
