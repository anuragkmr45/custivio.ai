import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  BookOpen,
  Warehouse,
  UserCheck,
  Wrench,
  ClipboardCheck,
  Users,
  ShieldCheck,
  KeySquare,
  Activity,
  Layers,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useCurrentSession } from "@/lib/auth";
import { canAccess, ROUTE_ACCESS, type RouteAccessKey } from "@/lib/permission-policy";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  routeAccess: RouteAccessKey;
};

const nav: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true, routeAccess: "dashboard" },
    ],
  },
  {
    label: "Inventory Operations",
    items: [
      { to: "/assets", label: "Assets", icon: Boxes, routeAccess: "assets" },
      { to: "/catalog", label: "Catalog", icon: BookOpen, routeAccess: "catalog" },
      { to: "/stock", label: "Stock", icon: Warehouse, routeAccess: "stock" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/custody", label: "Custody", icon: UserCheck, routeAccess: "custody" },
      { to: "/maintenance", label: "Maintenance", icon: Wrench, routeAccess: "maintenance" },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        to: "/audit-reports",
        label: "Audit & Reports",
        icon: ClipboardCheck,
        routeAccess: "auditReports",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users", icon: Users, routeAccess: "users" },
      { to: "/roles", label: "Roles", icon: ShieldCheck, routeAccess: "roles" },
      { to: "/assignments", label: "Assignments", icon: KeySquare, routeAccess: "assignments" },
      { to: "/status", label: "Status", icon: Activity, routeAccess: "status" },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useCurrentSession().data ?? null;
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1.5 py-1.5 text-sidebar-foreground">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-card"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Layers className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold tracking-tight">Custivio</span>
            <span className="truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/55">
              {session?.tenant.slug ?? "default"} · on-prem
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-1">
        {nav.map((group) => {
          const visibleItems = group.items.filter((item) => {
            return canAccess(session, ROUTE_ACCESS[item.routeAccess]);
          });
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const active = isActive(item.to, item.exact);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className={cn(
                            "relative h-9 rounded-md text-sidebar-foreground/85 transition-colors",
                            "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                            "data-[active=true]:bg-[color-mix(in_oklab,var(--primary)_22%,transparent)]",
                            "data-[active=true]:font-medium data-[active=true]:text-white",
                            "data-[active=true]:before:absolute data-[active=true]:before:bottom-1.5 data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-r data-[active=true]:before:bg-[var(--primary)]",
                          )}
                        >
                          <Link to={item.to}>
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden">
          v2025.05 · on-prem build
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
