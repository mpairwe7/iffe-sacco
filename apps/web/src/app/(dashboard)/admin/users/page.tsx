"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { EditUserModal } from "@/components/modals/edit-user-modal";
import { UserCog, Pencil } from "lucide-react";
import { useUsers, useActivateUser, useDeactivateUser } from "@/hooks/use-users";
import { toast } from "sonner";
import type { User } from "@iffe/shared";

export default function UsersPage() {
  const { data, isLoading, error, refetch } = useUsers();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const users = (data?.data || []) as User[];

  async function handleToggleStatus(user: User) {
    try {
      if (user.isActive) {
        await deactivateUser.mutateAsync(user.id);
        toast.success("User deactivated");
      } else {
        await activateUser.mutateAsync(user.id);
        toast.success("User activated");
      }
    } catch {
      toast.error("Failed to update user status");
    }
  }

  function openEdit(user: User) {
    setEditUser(user);
    setEditOpen(true);
  }

  const columns = [
    {
      key: "name",
      label: "User",
      render: (row: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {row.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <p className="font-medium text-text">{row.name}</p>
            <p className="text-xs text-text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row: User) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.role === "admin" ? "bg-primary/10 text-primary" : "bg-surface-alt text-text-muted"
          }`}
        >
          {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (row: User) => <span className="text-text-muted">{row.lastLogin || "Never"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row: User) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.isActive ? "bg-success/15 text-success" : "bg-text-light/10 text-text-light"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-2.5 text-text-muted hover:text-primary rounded-lg hover:bg-primary/10"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            disabled={activateUser.isPending || deactivateUser.isPending}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
              row.isActive
                ? "text-danger border border-danger/30 hover:bg-danger/15"
                : "text-success border border-success/30 hover:bg-success/15"
            }`}
          >
            {row.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <UserCog className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-text-muted text-sm">Manage system users and roles</p>
        </div>
      </div>
      <DataTable
        title="All Users"
        columns={columns}
        data={users}
        addHref="#"
        addLabel="Add User"
        searchPlaceholder="Search users..."
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
      />

      <EditUserModal
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editUser}
      />
    </div>
  );
}
