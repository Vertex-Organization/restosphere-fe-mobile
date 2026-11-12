import type { Role } from "./types";

export const ROLE_LABELS: Record<Role, string> = {
  RECEPTIONIST: "Lễ tân",
  WAITER: "Phục vụ",
  KITCHEN: "Bếp",
  CASHIER: "Thu ngân",
  MANAGER: "Quản lý",
};
export const isReceptionist = (role?: Role) => role === "RECEPTIONIST";
export const isWaiter = (role?: Role) => role === "WAITER";
export const workspaceHref = (role?: Role) =>
  isReceptionist(role) ? "/reception/overview" : isWaiter(role) ? "/waiter/overview" : "/login";
