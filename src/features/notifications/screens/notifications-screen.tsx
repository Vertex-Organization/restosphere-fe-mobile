import { router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { AppIcon, Button, EmptyState, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors } from "@/theme";
import { dateTimeLabel } from "@/utils/dates";
export default function NotificationsScreen() {
  const { state, run } = useApp();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <Screen scroll={false}>
      <FlatList
        data={state.notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={ui.content}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 12 }}>
            <Text style={ui.muted}>{unread} thông báo chưa đọc</Text>
            <Button
              title="Đánh dấu tất cả đã đọc"
              icon="checkmark-done-outline"
              variant="secondary"
              disabled={!unread}
              onPress={() => run({ type: "read" })}
            />
          </View>
        }
        renderItem={({ item: n }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              run({ type: "read", id: n.id });
              if (n.reservationId)
                router.push(`/reception/reservations/${n.reservationId}`);
              else if (n.tableId) router.push(`/reception/tables/${n.tableId}`);
            }}
            style={({ pressed }) => ({
              padding: 14,
              borderRadius: 16,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surface : n.read ? colors.white : colors.primarySoft,
              gap: 8,
            })}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <AppIcon
                name={n.read ? "notifications-outline" : "notifications"}
                size={18}
              />
              <Text
                style={[
                  ui.text,
                  { fontSize: 15, flex: 1, fontWeight: n.read ? "500" : "700" },
                ]}
              >
                {!n.read ? "● Chưa đọc · " : "Đã đọc · "}
                {n.title}
              </Text>
            </View>
            <Text style={ui.text}>{n.body}</Text>
            <Text style={ui.muted}>{dateTimeLabel(n.at)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Chưa có thông báo"
            description="Thông báo sẽ xuất hiện khi có thay đổi đặt bàn."
          />
        }
      />
    </Screen>
  );
}
