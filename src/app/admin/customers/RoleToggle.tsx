"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { setRole } from "../actions";

export default function RoleToggle({ userId, role, isSelf }: { userId: string; role: "customer" | "admin"; isSelf: boolean }) {
  const [pending, start] = useTransition();
  return (
    <select
      className="input w-32 py-1"
      defaultValue={role}
      disabled={pending || isSelf}
      onChange={(e) => {
        const next = e.target.value as "customer" | "admin";
        if (next === "admin" && !confirm("Give this user full admin access?")) {
          e.target.value = role;
          return;
        }
        start(async () => {
          const res = await setRole(userId, next);
          if (res.error) toast.error(res.error);
          else toast.success("Role updated");
        });
      }}
    >
      <option value="customer">Customer</option>
      <option value="admin">Admin</option>
    </select>
  );
}
