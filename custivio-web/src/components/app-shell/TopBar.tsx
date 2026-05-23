import { Bell, ChevronDown, LogOut, Search, Settings, UserRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getDisplayInitials, useCurrentSession, useLogoutMutation } from "@/lib/auth";

export function TopBar() {
  const navigate = useNavigate();
  const sessionQuery = useCurrentSession();
  const logoutMutation = useLogoutMutation();
  const session = sessionQuery.data ?? null;
  const tenant = session?.tenant;
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:gap-3 sm:px-4">
      <SidebarTrigger className="text-foreground" />
      <div className="hidden h-6 w-px bg-border md:block" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 rounded-md font-medium">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tenant
            </span>
            <span className="text-sm">{tenant?.name ?? "Loading..."}</span>
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs">Current tenant</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-start gap-2">
            <div
              className="flex size-7 items-center justify-center rounded text-[10px] font-semibold text-white"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {(tenant?.slug ?? "IP").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm">{tenant?.name ?? "Custivio"}</span>
              <span className="text-xs text-muted-foreground">{tenant?.slug ?? "default"}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative ml-1 hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Global search unavailable"
          disabled
          className="h-9 rounded-md border-border/70 bg-surface-2 pl-9 text-sm focus-visible:bg-card"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications unavailable" disabled>
          <Bell className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md border border-border bg-card px-1.5 py-1 text-left transition-colors hover:bg-surface-2">
              <Avatar className="size-7">
                <AvatarFallback
                  className="text-[11px] font-semibold text-white"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  {getDisplayInitials(session)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col leading-tight md:flex">
                <span className="text-xs font-semibold text-foreground">
                  {user?.displayName ?? "Signed in"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {session?.permissionKeys.length ?? 0} permissions
                </span>
              </div>
              <ChevronDown className="size-3.5 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">
              {user?.email ?? "Loading session..."}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserRound className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="size-4" /> Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={logoutMutation.isPending}
              onClick={async () => {
                await logoutMutation.mutateAsync().catch(() => undefined);
                navigate({ to: "/login", search: { redirect: "/" }, replace: true });
              }}
            >
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
