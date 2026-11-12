import { router } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { NotificationListHeader, NotificationRow } from "@/components/notifications/notification-list";
import { EmptyState, type IconName, Message, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { visibleNotifications } from "../selectors";
import type { WaiterNotification } from "../types";
import { openTable, useWaiterAction } from "../components/service-ui";

const notificationKinds: Record<WaiterNotification["kind"], { category: string; icon: IconName; tone: "primary" | "success" | "danger" | "warning" }> = {
  HANDOVER: { category: "Tiếp nhận bàn", icon: "swap-horizontal-outline", tone: "warning" },
  READY: { category: "Món sẵn sàng", icon: "restaurant-outline", tone: "success" },
  REJECTED: { category: "Món cần xử lý", icon: "alert-circle-outline", tone: "danger" },
  PAYMENT: { category: "Thanh toán", icon: "receipt-outline", tone: "primary" },
  TABLE: { category: "Tình trạng bàn", icon: "grid-outline", tone: "primary" },
};

export default function WaiterNotificationsScreen() {
  const { state } = useApp();
  const { act, error } = useWaiterAction();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const all = visibleNotifications(state);
  const unread = all.filter((n) => !n.readBy.includes(state.session!.id)).length;
  const notifications = [...all].filter((n) => !onlyUnread || !n.readBy.includes(state.session!.id)).sort((a, b) => b.at.localeCompare(a.at));
  return <Screen scroll={false}><FlatList data={notifications} keyExtractor={(n) => n.id} contentContainerStyle={[ui.content, { gap: 0 }]}
    ListHeaderComponent={<View><NotificationListHeader unread={unread} total={all.length} onlyUnread={onlyUnread} onFilter={setOnlyUnread}
      readAllLabel={`Đánh dấu đã đọc (${unread})`} onReadAll={() => act({ type: "read-notification" })} />
      {!!error && <View style={{ paddingBottom: 12 }}><Message>{error}</Message></View>}</View>}
    renderItem={({ item: n }) => <NotificationRow title={n.title} body={n.body} at={n.at} unread={!n.readBy.includes(state.session!.id)} {...notificationKinds[n.kind]}
      onPress={() => act({ type: "read-notification", id: n.id }, () => {
        const s = state.tableSessions.find((s) => s.id === n.sessionId)!;
        if (n.kind === "PAYMENT") router.push({ pathname: "/waiter/payment", params: { sessionId: s.id } });
        else if (n.kind === "READY" || n.kind === "REJECTED") router.push({ pathname: "/waiter/progress", params: { sessionId: s.id } });
        else openTable(s);
      })} />}
    ListEmptyComponent={<EmptyState title={onlyUnread ? "Đã đọc hết thông báo" : "Chưa có thông báo"}
      description={onlyUnread ? "Bạn đã xem tất cả thông báo trong ca." : "Bàn giao, món hoàn thành và thanh toán sẽ xuất hiện tại đây."} />} /></Screen>;
}
