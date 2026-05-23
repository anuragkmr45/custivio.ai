import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Edit, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, Panel } from "@/components/data/Panel";
import { Button } from "@/components/ui/button";
import { createRole, listRoles, updateRole, type RoleSummary } from "@/lib/api/admin";
import { unwrapApiResult } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useCurrentSession } from "@/lib/auth";
import {
  ACTION_ACCESS,
  canAccess,
  formatPermissionRequirement,
  ROUTE_ACCESS,
} from "@/lib/permission-policy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clampPage, formatPaginationRange, getPageCount, paginate } from "@/lib/pagination";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({
    meta: [
      { title: "Roles - Custivio" },
      { name: "description", content: "Roles and permission matrix for tenant access control." },
    ],
  }),
  component: RolesPage,
});

const rolesQueryKey = ["admin", "roles"] as const;
const roleListPageSize = 8;

function RolesPage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canManageRoles = canAccess(session, ACTION_ACCESS.roleAdmin);
  const [selected, setSelected] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rolePage, setRolePage] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const rolesQuery = useQuery({
    queryKey: rolesQueryKey,
    queryFn: async () => unwrapApiResult(await listRoles()).roles,
    enabled: canManageRoles,
  });

  const createMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setCreateError(null);
      const permissionKeys = readPermissionKeys(form);
      return unwrapApiResult(
        await createRole({
          key: String(form.get("key") ?? ""),
          name: String(form.get("name") ?? ""),
          description: String(form.get("description") ?? "") || undefined,
          permissionKeys,
        }),
      ).role;
    },
    onSuccess: async (role) => {
      setSelected(role.id);
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
    onError: (error) => {
      setCreateError(error instanceof Error ? error.message : "Could not create role.");
    },
  });

  const editMutation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!role) throw new Error("No role selected.");
      setEditError(null);
      const permissionKeys = readPermissionKeys(form);
      return unwrapApiResult(
        await updateRole(role.id, {
          name: String(form.get("name") ?? ""),
          description: String(form.get("description") ?? "") || undefined,
          permissionKeys,
        }),
      ).role;
    },
    onSuccess: async (updatedRole) => {
      setSelected(updatedRole.id);
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
    onError: (error) => {
      setEditError(error instanceof Error ? error.message : "Could not update role.");
    },
  });

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const safeRolePage = clampPage(rolePage, roles.length, roleListPageSize);
  const pagedRoles = useMemo(
    () => paginate(roles, safeRolePage, roleListPageSize),
    [roles, safeRolePage],
  );
  const role = pagedRoles.find((r) => r.id === selected) ?? pagedRoles[0] ?? roles[0];
  const rolePageCount = getPageCount(roles.length, roleListPageSize);
  const permissions = useMemo(() => collectPermissions(roles), [roles]);
  const changeRolePage = (nextPage: number) => {
    const page = clampPage(nextPage, roles.length, roleListPageSize);
    setRolePage(page);
    setSelected(roles[page * roleListPageSize]?.id ?? null);
  };

  if (!canManageRoles) {
    return (
      <>
        <PageHeader
          title="Roles"
          description="Roles and permission matrix for tenant access control."
        />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot manage roles."
            required={formatPermissionRequirement(ROUTE_ACCESS.roles)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Roles"
        description="Backend role definitions and permission matrix."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                New role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={(formData) => createMutation.mutate(formData)} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>New role</DialogTitle>
                  <DialogDescription>
                    Permission keys must match backend permission names.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <Field name="key" label="Role key" required />
                  <Field name="name" label="Name" required />
                  <div className="grid gap-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <PermissionChecklist permissions={permissions} selectedKeys={[]} />
                  {createError && (
                    <p className="text-sm text-[var(--destructive)]">{createError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Create role
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageBody className="box-border h-[calc(100dvh-12rem)] min-h-0 overflow-hidden">
        {rolesQuery.isLoading && <LoadingPanel label="Loading roles..." />}
        {rolesQuery.isError && (
          <ApiErrorPanel error={rolesQuery.error} onRetry={() => rolesQuery.refetch()} />
        )}
        {rolesQuery.data && (
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_1fr]">
            <Panel
              title="Roles"
              description={formatPaginationRange(roles.length, safeRolePage, roleListPageSize)}
              className="flex min-h-0 flex-col overflow-hidden"
              bodyClassName="flex min-h-0 flex-1 flex-col p-0"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                  {pagedRoles.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelected(r.id)}
                        className={cn(
                          "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                          role?.id === r.id
                            ? "border-accent bg-surface-2"
                            : "border-transparent hover:border-border hover:bg-surface-2",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate font-medium">{r.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{r.status}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {r.description ?? "No description"}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <PageControls
                page={safeRolePage}
                pageCount={rolePageCount}
                onPrevious={() => changeRolePage(safeRolePage - 1)}
                onNext={() => changeRolePage(safeRolePage + 1)}
              />
            </Panel>

            <Panel
              title={role ? `${role.name} permission matrix` : "Permission matrix"}
              description={role?.description ?? "Select a role to inspect permissions."}
              actions={
                role && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Edit className="size-4" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form
                        action={(formData) => editMutation.mutate(formData)}
                        className="space-y-4"
                      >
                        <DialogHeader>
                          <DialogTitle>Edit role</DialogTitle>
                          <DialogDescription>
                            Updates backend role metadata and permission keys.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3">
                          <Field name="name" label="Name" defaultValue={role.name} required />
                          <div className="grid gap-1.5">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              name="description"
                              defaultValue={role.description ?? ""}
                            />
                          </div>
                          <PermissionChecklist
                            permissions={permissions}
                            selectedKeys={role.permissionKeys}
                          />
                          {editError && (
                            <p className="text-sm text-[var(--destructive)]">{editError}</p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={editMutation.isPending}>
                            Save role
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )
              }
              className="flex min-h-0 flex-col overflow-hidden"
              bodyClassName="min-h-0 flex-1 overflow-y-auto p-4"
            >
              {role ? (
                <PermissionMatrix role={role} permissions={permissions} />
              ) : (
                <p className="text-sm text-muted-foreground">No roles found.</p>
              )}
            </Panel>
          </div>
        )}
      </PageBody>
    </>
  );
}

function PageControls({
  page,
  pageCount,
  onPrevious,
  onNext,
}: {
  page: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
      <span>
        Page {Math.min(page + 1, pageCount)} of {pageCount}
      </span>
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="sm" disabled={page <= 0} onClick={onPrevious}>
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page + 1 >= pageCount}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function PermissionMatrix({
  role,
  permissions,
}: {
  role: RoleSummary;
  permissions: Record<string, string[]>;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(permissions).map(([group, keys]) => (
        <div key={group}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group}
          </h3>
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <tbody>
                {keys.map((key) => {
                  const has = role.permissionKeys.includes(key);
                  return (
                    <tr key={key} className="border-b border-border/60 last:border-b-0">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{key}</td>
                      <td className="px-3 py-2 text-right">
                        {has ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_oklab,var(--success)_14%,transparent)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                            <Check className="size-3" /> Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <Minus className="size-3" /> Not granted
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function PermissionChecklist({
  permissions,
  selectedKeys,
}: {
  permissions: Record<string, string[]>;
  selectedKeys: string[];
}) {
  const knownKeys = new Set(Object.values(permissions).flat());
  const unknownSelectedKeys = selectedKeys.filter((key) => !knownKeys.has(key));

  return (
    <div className="grid gap-3">
      <Label>Permissions</Label>
      <div className="max-h-72 overflow-auto rounded-md border border-border p-3">
        {Object.entries(permissions).map(([group, keys]) => (
          <fieldset key={group} className="mb-4 last:mb-0">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {keys.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="permissionKeys"
                    value={key}
                    defaultChecked={selectedKeys.includes(key)}
                  />
                  <span className="font-mono text-xs">{key}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {unknownSelectedKeys.map((key) => (
          <input key={key} type="hidden" name="permissionKeys" value={key} />
        ))}
      </div>
      {unknownSelectedKeys.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Preserving unknown permission keys: {unknownSelectedKeys.join(", ")}
        </p>
      )}
    </div>
  );
}

function collectPermissions(roles: RoleSummary[]) {
  const groups: Record<string, Set<string>> = {};
  for (const role of roles) {
    for (const key of role.permissionKeys) {
      const [group = "other"] = key.split(".");
      (groups[group] ||= new Set()).add(key);
    }
  }

  return Object.fromEntries(
    Object.entries(groups).map(([group, keys]) => [group, [...keys].sort()]),
  );
}

function readPermissionKeys(form: FormData): string[] {
  return form
    .getAll("permissionKeys")
    .map((key) => String(key).trim())
    .filter(Boolean);
}

function Field({
  name,
  label,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required={required} defaultValue={defaultValue} />
    </div>
  );
}
