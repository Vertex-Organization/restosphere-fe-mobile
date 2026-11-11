import { WorkspaceTabs, type WorkspaceTab } from "@/components/layout/workspace-tabs";

const tabs: WorkspaceTab[] = [
  {
    name: "overview",
    title: "Tổng quan",
    icon: "grid-outline",
    activeIcon: "grid",
  },
  {
    name: "bookings",
    title: "Đặt bàn",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    name: "tables",
    title: "Bàn",
    icon: "restaurant-outline",
    activeIcon: "restaurant",
  },
  {
    name: "profile",
    title: "Cá nhân",
    icon: "person-outline",
    activeIcon: "person",
  },
];

export default function ReceptionTabsLayout() {
  return (
    <WorkspaceTabs
      tabs={tabs}
      notificationsHref="/reception/notifications"
      profileHref="/reception/profile"
    />
  );
}
