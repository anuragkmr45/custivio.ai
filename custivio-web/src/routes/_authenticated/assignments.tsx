import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, Panel } from "@/components/data/Panel";
import { Button } from "@/components/ui/button";
import {
  createRoleAssignment,
  deleteRoleAssignment,
  listRoleAssignments,
  listRoles,
  listUsers,
  type AdminUser,
  type RoleAssignmentSummary,
  type RoleSummary,
} from "@/lib/api/admin";
import { unwrapApiResult } from "@/lib/api/errors";
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
import { Label } from "@/components/ui/label";
import { clampPage, formatPaginationRange, getPageCount, paginate } from "@/lib/pagination";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments - Custivio" },
      { name: "description", content: "User-to-role assignments scoped by location." },
    ],
  }),
  component: AssignmentsPage,
});

const assignmentsQueryKey = ["admin", "assignments-overview"] as const;
const assignmentUserPageSize = 12;

type AssignmentOverview = {
  users: AdminUser[];
  roles: RoleSummary[];
  assignments: RoleAssignmentSummary[];
};

function AssignmentsPage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canManageRoles = canAccess(session, ACTION_ACCESS.roleAdmin);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userPage, setUserPage] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: assignmentsQueryKey,
    queryFn: async (): Promise<AssignmentOverview> => {
      const [users, roles, assignments] = await Promise.all([
        listUsers(),
        listRoles(),
        listRoleAssignments(),
      ]);

      return {
        users: unwrapApiResult(users).users,
        roles: unwrapApiResult(roles).roles,
        assignments: unwrapApiResult(assignments).assignments,
      };
    },
    enabled: canManageRoles,
  });

  const createMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setCreateError(null);
      return unwrapApiResult(
        await createRoleAssignment({
          userId: String(form.get("userId") ?? ""),
          roleId: String(form.get("roleId") ?? ""),
          scopeType: String(form.get("scopeType") ?? "tenant") || "tenant",
        }),
      ).assignment;
    },
    onSuccess: async () => {
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: assignmentsQueryKey });
    },
    onError: (error) => {
      setCreateError(error instanceof Error ? error.message : "Could not assign role.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => unwrapApiResult(await deleteRoleAssignment(id)).assignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assignmentsQueryKey }),
  });

  const users = useMemo(() => overviewQuery.data?.users ?? [], [overviewQuery.data?.users]);
  const roles = useMemo(() => overviewQuery.data?.roles ?? [], [overviewQuery.data?.roles]);
  const assignments = useMemo(
    () => overviewQuery.data?.assignments ?? [],
    [overviewQuery.data?.assignments],
  );
  const safeUserPage = clampPage(userPage, users.length, assignmentUserPageSize);
  const pagedUsers = useMemo(
    () => paginate(users, safeUserPage, assignmentUserPageSize),
    [safeUserPage, users],
  );
  const userPageCount = getPageCount(users.length, assignmentUserPageSize);

  const assignmentsByUserRole = useMemo(() => {
    return new Map(
      assignments.map((assignment) => [`${assignment.userId}:${assignment.roleId}`, assignment]),
    );
  }, [assignments]);

  if (!canManageRoles) {
    return (
      <>
        <PageHeader
          title="Role Assignments"
          description="Effective user x role scope grid from backend RBAC assignments."
        />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot manage role assignments."
            required={formatPermissionRequirement(ROUTE_ACCESS.assignments)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Role Assignments"
        description="Effective user x role scope grid from backend RBAC assignments."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                Assign role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={(formData) => createMutation.mutate(formData)} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Assign role</DialogTitle>
                  <DialogDescription>
                    Assigns a backend role to a tenant user with tenant scope by default.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <SelectField name="userId" label="User" options={users.map(userOption)} />
                  <SelectField name="roleId" label="Role" options={roles.map(roleOption)} />
                  <SelectField
                    name="scopeType"
                    label="Scope"
                    options={[{ value: "tenant", label: "Tenant" }]}
                  />
                  {createError && (
                    <p className="text-sm text-[var(--destructive)]">{createError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Assign
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageBody className="box-border h-[calc(100dvh-12rem)] min-h-0 overflow-hidden">
        {overviewQuery.isLoading && <LoadingPanel label="Loading assignments..." />}
        {overviewQuery.isError && (
          <ApiErrorPanel error={overviewQuery.error} onRetry={() => overviewQuery.refetch()} />
        )}
        {overviewQuery.data && (
          <Panel
            title="Assignment matrix"
            description={formatPaginationRange(users.length, safeUserPage, assignmentUserPageSize)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            bodyClassName="flex min-h-0 flex-1 flex-col p-0"
          >
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-surface-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-border bg-surface-2 px-3 py-2 text-left font-medium">
                      User
                    </th>
                    <th className="border-b border-border px-3 py-2 text-left font-medium">
                      Scope
                    </th>
                    {roles.map((r) => (
                      <th
                        key={r.id}
                        className="border-b border-border px-3 py-2 text-center font-medium"
                      >
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 last:border-b-0">
                      <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">
                        {u.displayName}
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs">tenant</span>
                      </td>
                      {roles.map((r) => {
                        const assignment = assignmentsByUserRole.get(`${u.id}:${r.id}`);
                        return (
                          <td key={r.id} className="px-3 py-2 text-center">
                            {assignment ? (
                              <button
                                type="button"
                                title="Remove assignment"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(assignment.id)}
                                className="inline-flex size-6 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)]"
                              >
                                <Check className="size-3.5" />
                              </button>
                            ) : (
                              <span className="inline-flex size-6 items-center justify-center text-muted-foreground/40">
                                <X className="size-3" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PageControls
              page={safeUserPage}
              pageCount={userPageCount}
              onPrevious={() =>
                setUserPage((page) => clampPage(page - 1, users.length, assignmentUserPageSize))
              }
              onNext={() =>
                setUserPage((page) => clampPage(page + 1, users.length, assignmentUserPageSize))
              }
            />
          </Panel>
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

function userOption(user: AdminUser) {
  return { value: user.id, label: `${user.displayName} <${user.email}>` };
}

function roleOption(role: RoleSummary) {
  return { value: role.id, label: role.name };
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
