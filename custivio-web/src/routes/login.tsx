import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Layers, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentSessionQueryOptions, useCurrentSession, useLoginMutation } from "@/lib/auth";
import { ApiClientError, isBackendUnavailableError } from "@/lib/api/errors";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Custivio" },
      { name: "description", content: "Sign in to the Custivio tenant workspace." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: (s.redirect as string) || "/",
  }),
  beforeLoad: async ({ search, context }) => {
    const session = await context.queryClient
      .fetchQuery(currentSessionQueryOptions())
      .catch(() => null);
    if (session) {
      throw redirect({ to: search.redirect || "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const sessionQuery = useCurrentSession();
  const loginMutation = useLoginMutation();
  const [tenant, setTenant] = useState("default");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tenant || !email || !password) {
      setError("All fields are required.");
      return;
    }
    try {
      await loginMutation.mutateAsync({
        tenantSlug: tenant.trim(),
        email: email.trim(),
        password,
      });
      navigate({ to: search.redirect || "/" });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(
          err.retryAfterSeconds
            ? `${err.message} Try again in ${err.retryAfterSeconds}s.`
            : err.message,
        );
        return;
      }
      setError("Sign-in failed. Check the API connection and try again.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Layers className="size-5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Custivio</span>
        </div>
        <div className="space-y-4">
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            IT asset and inventory operations, on your own infrastructure.
          </h1>
          <p className="max-w-md text-sm text-sidebar-foreground/70">
            Tenant-scoped registries, custody workflows, stock ledgers, audit campaigns and
            compliance-ready reports — running entirely on-prem.
          </p>
          <div className="grid max-w-md grid-cols-3 gap-3 pt-4">
            {[
              { k: "Modules", v: "11" },
              { k: "Roles", v: "7" },
              { k: "On-prem", v: "Yes" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-md border border-sidebar-border bg-sidebar-accent/40 px-3 py-2"
              >
                <div className="text-xs uppercase tracking-wider text-sidebar-foreground/60">
                  {s.k}
                </div>
                <div className="text-lg font-semibold">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Authorised use only. Activity is logged and audited.
        </p>
      </aside>

      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Layers className="size-4" />
              </div>
              <span className="text-sm font-semibold">Custivio</span>
            </div>
          </div>
          {isBackendUnavailableError(sessionQuery.error) && (
            <div
              role="status"
              className="mb-4 rounded-md border border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] px-3 py-2 text-xs text-foreground"
            >
              <div className="font-medium">Backend API unavailable</div>
              <div className="mt-1 text-muted-foreground">
                The app is loaded, but the API server is not reachable at the configured address.
                Start the backend and then try signing in again.
              </div>
            </div>
          )}
          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Lock className="size-4 text-accent" />
              <h2 className="text-base font-semibold tracking-tight">Sign in to your tenant</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tenant" className="text-xs">
                  Tenant code
                </Label>
                <Input
                  id="tenant"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  className="h-9 font-mono tracking-wider"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] px-3 py-2 text-xs text-[var(--destructive)]"
                >
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <div className="font-medium">Sign-in failed</div>
                    <div className="text-[var(--destructive)]/80">{error}</div>
                  </div>
                </div>
              )}
              <Button type="submit" className="h-9 w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Use local UAT credentials after the backend seed is applied.
              </p>
            </form>
          </div>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Tenant slug: <span className="font-mono">{tenant || "—"}</span> · API-backed session
          </p>
        </div>
      </section>
    </div>
  );
}
