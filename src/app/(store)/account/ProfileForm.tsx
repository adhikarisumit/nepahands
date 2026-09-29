"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { updateProfile } from "@/app/(store)/actions";

export default function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="card grid gap-5 p-6 sm:grid-cols-2"
      action={(fd) =>
        start(async () => {
          const res = await updateProfile(fd);
          if (res.error) toast.error(res.error);
          else toast.success("Profile saved");
        })
      }
    >
      <div>
        <label className="label">Full name</label>
        <input name="full_name" className="input" defaultValue={fullName} placeholder="Your name" />
      </div>
      <div>
        <label className="label">Phone</label>
        <input name="phone" type="tel" className="input" defaultValue={phone} placeholder="+1 555 000 0000" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Email</label>
        <input className="input cursor-not-allowed bg-clay-50 text-ink/60" value={email} disabled />
      </div>
      <div className="flex justify-end sm:col-span-2">
        <button className="btn-primary px-8" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  );
}
