import { Heart, LayoutDashboard, Package, Shield, Tag, UserRound } from "lucide-react";

/** Shared by the account sidebar and the header account dropdown so both stay in sync. */
export const ACCOUNT_LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/coupons", label: "Coupons", icon: Tag },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile & security", icon: UserRound },
];

export const ADMIN_LINK = { href: "/admin", label: "Admin panel", icon: Shield };

export const isActiveLink = (path: string, href: string) =>
  href === "/account" ? path === href : path.startsWith(href);
