import {
  createFileRoute,
  redirect,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-shell/AppSidebar";
import { TopBar } from "@/components/app-shell/TopBar";
import { currentSessionQueryOptions, useCurrentSession } from "@/lib/auth";
import { ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { isBackendUnavailableError } from "@/lib/api/errors";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location, context }) => {
    if (typeof window === "undefined") return;

    const session = await context.queryClient
      .fetchQuery(currentSessionQueryOptions())
      .catch((error) => {
        if (isBackendUnavailableError(error)) return undefined;
        return null;
      });
    if (session === undefined) return;
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthenticatedShell,
});

function AuthenticatedShell() {
  const sessionQuery = useCurrentSession();
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (sessionQuery.data) {
      redirectedRef.current = false;
      return;
    }

    if (
      sessionQuery.data === null &&
      !sessionQuery.isLoading &&
      !sessionQuery.isFetching &&
      !redirectedRef.current
    ) {
      redirectedRef.current = true;
      void navigate({ to: "/login", search: { redirect: location.href }, replace: true });
    }
  }, [location.href, navigate, sessionQuery.data, sessionQuery.isFetching, sessionQuery.isLoading]);

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <LoadingPanel label="Checking session..." />
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ApiErrorPanel
          title="Backend API unavailable"
          error={sessionQuery.error}
          onRetry={() => {
            void sessionQuery.refetch();
          }}
        />
      </div>
    );
  }

  if (!sessionQuery.data) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-col bg-background">
        <TopBar />
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
