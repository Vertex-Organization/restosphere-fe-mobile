import { router } from "expo-router";
import { useState } from "react";
import { FlatList } from "react-native";
import { Screen } from "@/components/layout/screen";
import { NotificationListHeader, NotificationRow } from "@/components/notifications/notification-list";
import { EmptyState, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";

export default function NotificationsScreen() {
  const { state, run } = useApp();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const unread = state.notifications.filter((n) => !n.read).length;
  const notifications = [...state.notifications].filter((n) => !onlyUnread || !n.read).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Screen scroll={false}>
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[ui.content, { gap: 0 }]}
        ListHeaderComponent={<NotificationListHeader unread={unread} total={state.notifications.length} onlyUnread={onlyUnread} onFilter={setOnlyUnread}
          readAllLabel="Đánh dấu tất cả đã đọc" onReadAll={() => run({ type: "read" })} />}
        renderItem={({ item: n }) => <NotificationRow title={n.title} body={n.body} at={n.at} unread={!n.read}
          category={n.reservationId ? "Đặt bàn" : n.tableId ? "Tình trạng bàn" : "Trong ca làm việc"}
          icon={n.reservationId ? "calendar-outline" : n.tableId ? "grid-outline" : "notifications-outline"}
          onPress={() => {
            run({ type: "read", id: n.id });
            if (n.reservationId) router.push(`/reception/reservations/${n.reservationId}`);
            else if (n.tableId) router.push(`/reception/tables/${n.tableId}`);
          }} />}
        ListEmptyComponent={<EmptyState title={onlyUnread ? "Đã đọc hết thông báo" : "Chưa có thông báo"}
          description={onlyUnread ? "Bạn đã xem tất cả thông báo trong ca." : "Thông báo sẽ xuất hiện khi có thay đổi đặt bàn."} />}
      />
    </Screen>
  );
}
