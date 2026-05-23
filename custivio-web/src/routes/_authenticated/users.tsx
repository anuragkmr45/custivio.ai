import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, KeyRound, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody } from "@/components/data/Panel";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  createUser,
  disableUser,
  listRoleAssignments,
  listRoles,
  listUsers,
  resetUserPassword,
  updateUser,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users - Custivio" },
      { name: "description", content: "Tenant-scoped users and role assignments." },
    ],
  }),
  component: UsersPage,
});

const adminUsersQueryKey = ["admin", "users-overview"] as const;

type UsersOverview = {
  users: AdminUser[];
  roles: RoleSummary[];
  assignments: RoleAssignmentSummary[];
};

function UsersPage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canManageUsers = canAccess(session, ACTION_ACCESS.userAdmin);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: adminUsersQueryKey,
    queryFn: async (): Promise<UsersOverview> => {
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
    enabled: canManageUsers,
  });

  const createMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setCreateError(null);
      const result = await createUser({
        email: String(form.get("email") ?? ""),
        displayName: String(form.get("displayName") ?? ""),
        password: String(form.get("password") ?? ""),
        jobTitle: String(form.get("jobTitle") ?? "") || undefined,
      });
      return unwrapApiResult(result).user;
    },
    onSuccess: async () => {
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
    onError: (error) => {
      setCreateError(error instanceof Error ? error.message : "Could not create user.");
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (id: string) => unwrapApiResult(await disableUser(id)).user,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUsersQueryKey }),
  });

  const editMutation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!editUser) throw new Error("No user selected.");
      setEditError(null);
      return unwrapApiResult(
        await updateUser(editUser.id, {
          displayName: String(form.get("displayName") ?? ""),
          jobTitle: String(form.get("jobTitle") ?? "") || undefined,
          status: String(form.get("status") ?? editUser.status) as
            | "active"
            | "disabled"
            | "invited",
        }),
      ).user;
    },
    onSuccess: async () => {
      setEditUser(null);
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
    onError: (error) => {
      setEditError(error instanceof Error ? error.message : "Could not update user.");
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!resetUser) throw new Error("No user selected.");
      setResetError(null);
      return unwrapApiResult(
        await resetUserPassword(resetUser.id, String(form.get("password") ?? "")),
      ).user;
    },
    onSuccess: async () => {
      setResetUser(null);
      await queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
    },
    onError: (error) => {
      setResetError(error instanceof Error ? error.message : "Could not reset password.");
    },
  });

  const roleById = useMemo(() => {
    return new Map((usersQuery.data?.roles ?? []).map((role) => [role.id, role]));
  }, [usersQuery.data?.roles]);

  const assignmentsByUser = useMemo(() => {
    const grouped = new Map<string, RoleAssignmentSummary[]>();
    for (const assignment of usersQuery.data?.assignments ?? []) {
      const current = grouped.get(assignment.userId) ?? [];
      current.push(assignment);
      grouped.set(assignment.userId, current);
    }
    return grouped;
  }, [usersQuery.data?.assignments]);

  const cols: Column<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      searchValue: (r) => `${r.displayName} ${r.email}`,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="bg-secondary text-xs">
              {r.displayName
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{r.displayName}</div>
            <div className="text-xs text-muted-foreground">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      sortValue: (r) => roleNames(assignmentsByUser.get(r.id), roleById),
      cell: (r) => roleNames(assignmentsByUser.get(r.id), roleById),
    },
    {
      key: "jobTitle",
      header: "Job title",
      cell: (r) => r.jobTitle ?? <span className="text-muted-foreground">-</span>,
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditUser(r)}>
            <Edit className="size-4" />
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setResetUser(r)}>
            <KeyRound className="size-4" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={r.status === "disabled" || disableMutation.isPending}
            onClick={() => disableMutation.mutate(r.id)}
          >
            Disable
          </Button>
        </div>
      ),
    },
  ];

  if (!canManageUsers) {
    return (
      <>
        <PageHeader title="Users" description="Tenant-scoped users and role assignments." />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot manage users."
            required={formatPermissionRequirement(ROUTE_ACCESS.users)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Users"
        description={`${usersQuery.data?.users.length ?? 0} users in this tenant. Backend roles are resolved from live assignments.`}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="size-4" />
                Invite user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form action={(formData) => createMutation.mutate(formData)} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Invite user</DialogTitle>
                  <DialogDescription>
                    Creates a tenant user through the backend admin API.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <Field name="displayName" label="Display name" required />
                  <Field name="email" label="Email" type="email" required />
                  <Field name="password" label="Temporary password" type="password" required />
                  <Field name="jobTitle" label="Job title" />
                  {createError && (
                    <p className="text-sm text-[var(--destructive)]">{createError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Create user
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <PageBody>
        {usersQuery.isLoading && <LoadingPanel label="Loading users..." />}
        {usersQuery.isError && (
          <ApiErrorPanel error={usersQuery.error} onRetry={() => usersQuery.refetch()} />
        )}
        {usersQuery.data && (
          <DataTable
            rows={usersQuery.data.users}
            columns={cols}
            searchPlaceholder="Search by name or email..."
            initialSort={{ key: "name", dir: "asc" }}
          />
        )}
        <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
          <DialogContent>
            <form action={(formData) => editMutation.mutate(formData)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Edit user</DialogTitle>
                <DialogDescription>Updates tenant user profile metadata.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field
                  name="displayName"
                  label="Display name"
                  defaultValue={editUser?.displayName}
                  required
                />
                <Field name="jobTitle" label="Job title" defaultValue={editUser?.jobTitle ?? ""} />
                <div className="grid gap-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editUser?.status ?? "active"}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                {editError && <p className="text-sm text-[var(--destructive)]">{editError}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editMutation.isPending}>
                  Save user
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(resetUser)} onOpenChange={(open) => !open && setResetUser(null)}>
          <DialogContent>
            <form action={(formData) => resetMutation.mutate(formData)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Reset password</DialogTitle>
                <DialogDescription>
                  Sets a new temporary password for {resetUser?.email}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Field name="password" label="New temporary password" type="password" required />
                {resetError && <p className="text-sm text-[var(--destructive)]">{resetError}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setResetUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={resetMutation.isPending}>
                  Reset password
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageBody>
    </>
  );
}

function roleNames(
  assignments: RoleAssignmentSummary[] | undefined,
  roleById: Map<string, RoleSummary>,
) {
  const names = assignments
    ?.map((assignment) => roleById.get(assignment.roleId)?.name ?? assignment.roleName)
    .filter(Boolean);

  return names?.length ? names.join(", ") : "-";
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? undefined}
      />
    </div>
  );
}
