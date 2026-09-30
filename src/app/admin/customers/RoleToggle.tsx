"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { setRole } from "../actions";
import { useConfirm } from "@/components/ConfirmDialog";

export default function RoleToggle({ userId, role, isSelf }: { userId: string; role: "customer" | "admin"; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const confirm = useConfirm();
  return (
    <select
      className="input w-32 py-1"
      defaultValue={role}
      disabled={pending || isSelf}
      onChange={async (e) => {
        const select = e.target;
        const next = select.value as "customer" | "admin";
        if (next === "admin") {
          const ok = await confirm({
            title: "Make this user an admin?",
            message: "Admins get full access to the admin panel — orders, customers, products and settings. They'll move to Settings → Users & admins.",
            confirmLabel: "Make admin",
            danger: true,
          });
          if (!ok) {
            select.value = role;
            return;
          }
        }
        start(async () => {
          const res = await setRole(userId, next);
          if (res.error) {
            toast.error(res.error);
            select.value = role;
          } else toast.success(next === "admin" ? "Now an admin — see Settings → Users & admins" : "Role updated");
        });
      }}
    >
      <option value="customer">Customer</option>
      <option value="admin">Admin</option>
    </select>
  );
}
