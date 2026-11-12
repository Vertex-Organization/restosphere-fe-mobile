import { WorkspaceTabs, type WorkspaceTab } from "@/components/layout/workspace-tabs";
const tabs: WorkspaceTab[] = [
  { name: "overview", title: "Tổng quan", icon: "grid-outline", activeIcon: "grid" },
  { name: "tables", title: "Bàn", icon: "restaurant-outline", activeIcon: "restaurant" },
  { name: "ready", title: "Món sẵn sàng", tabLabel: "Sẵn sàng", icon: "checkmark-circle-outline", activeIcon: "checkmark-circle" },
  { name: "profile", title: "Cá nhân", icon: "person-outline", activeIcon: "person" },
];
export default function WaiterTabsLayout() {
  return <WorkspaceTabs tabs={tabs} notificationsHref="/waiter/notifications" profileHref="/waiter/profile" />;
}
