import { router } from "expo-router";
import { useState } from "react";
import { FlatList } from "react-native";
import { Screen } from "@/components/layout/screen";
import { NotificationListHeader, NotificationRow } from "@/components/notifications/notification-list";
import { EmptyState, Message, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";

const KIND_CATEGORY: Record<string, string> = {
  TABLE_READY: "Bàn sẵn sàng", TABLE_REASSIGNED: "Đổi bàn", NEW_WEB_RESERVATION: "Đặt bàn từ website", REQUEST_DECIDED: "Kết quả yêu cầu",
  RESERVATION_CANCELLED: "Khách hủy lịch", AUTO_NO_SHOW: "Khách không đến", HOLD_EXPIRED: "Hết giờ giữ bàn",
};

export default function NotificationsScreen() {
  const { state, run } = useApp();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [error, setError] = useState("");
  async function read(id?: string, then?: () => void) {
    try { await run({ type: "read", id }); setError(""); then?.(); }
    catch (e) { setError((e as Error).message); }
  }
  const unread = state.notifications.filter((n) => !n.read).length;
  const notifications = [...state.notifications].filter((n) => !onlyUnread || !n.read).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Screen scroll={false}>
      {!!error && <Message>{error}</Message>}
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[ui.content, { gap: 0 }]}
        ListHeaderComponent={<NotificationListHeader unread={unread} total={state.notifications.length} onlyUnread={onlyUnread} onFilter={setOnlyUnread}
          readAllLabel="Đánh dấu tất cả đã đọc" onReadAll={() => read()} />}
        renderItem={({ item: n }) => <NotificationRow title={n.title} body={n.body} at={n.at} unread={!n.read}
          category={KIND_CATEGORY[n.kind ?? ""] ?? (n.reservationId ? "Đặt bàn" : n.tableId ? "Tình trạng bàn" : "Trong ca làm việc")}
          icon={n.kind === "TABLE_REASSIGNED" ? "swap-horizontal-outline" : n.kind === "REQUEST_DECIDED" ? "checkmark-circle-outline" : n.reservationId ? "calendar-outline" : n.tableId ? "grid-outline" : "notifications-outline"}
          onPress={() => read(n.id, () => {
            if (n.reservationId) router.push(`/reception/reservations/${n.reservationId}`);
            else if (n.tableId) router.push(`/reception/tables/${n.tableId}`);
          })} />}
        ListEmptyComponent={<EmptyState title={onlyUnread ? "Đã đọc hết thông báo" : "Chưa có thông báo"}
          description={onlyUnread ? "Bạn đã xem tất cả thông báo trong ca." : "Thông báo sẽ xuất hiện khi có thay đổi đặt bàn."} />}
      />
    </Screen>
  );
}
