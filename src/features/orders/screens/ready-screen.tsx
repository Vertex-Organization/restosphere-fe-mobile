import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { AppIcon, ConfirmDialog, EmptyState, Message, ui } from "@/components/ui";
import { colors, radius } from "@/theme";
import { useApp } from "@/store/app-store";
import { tableCode } from "@/features/tables/labels";
import { sessionItems, visibleSessions } from "@/features/waiter/selectors";
import { ItemRow, openTable, useWaiterAction } from "@/features/waiter/components/service-ui";

export default function ReadyScreen() {
  const { state } = useApp();
  const { act, error } = useWaiterAction();
  const [confirm, setConfirm] = useState<{ sessionId: string; itemId: string; label: string }>();
  const data = visibleSessions(state).filter((s) => s.waiterId === state.session?.id && !s.guestLeftAt && !s.closedAt).flatMap((s) => sessionItems(state, s.id).filter((i) => i.status === "READY").map((item) => ({ item, session: s }))).sort((a, b) => (a.item.readyAt ?? "").localeCompare(b.item.readyAt ?? ""));
  return <Screen tabbed scroll={false}><FlatList data={data} keyExtractor={({ item }) => item.id} contentContainerStyle={ui.content} contentInsetAdjustmentBehavior="automatic"
    ListHeaderComponent={<View style={{ gap: 8 }}><View style={[ui.row, { gap: 8 }]}><AppIcon name="restaurant-outline" color={colors.success} /><Text style={ui.heading}>{data.reduce((n, r) => n + r.item.quantity, 0)} phần chờ mang ra</Text></View><Text style={ui.caption}>Ưu tiên món bếp hoàn thành trước.</Text>{!!error && <Message>{error}</Message>}</View>}
    renderItem={({ item: row }) => <View style={{ backgroundColor: colors.white, borderRadius: radius.control, borderCurve: "continuous", paddingHorizontal: 12, paddingBottom: 4, borderLeftWidth: 3, borderLeftColor: colors.success }}><Pressable accessibilityRole="button" accessibilityLabel={`Xem bàn ${tableCode(state.tables, row.session.tableId)}`} onPress={() => openTable(row.session)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, opacity: pressed ? 0.6 : 1 })}><Text style={[ui.heading, { flex: 1 }]}>Bàn {tableCode(state.tables, row.session.tableId)}</Text><Text style={[ui.caption, { color: colors.primary }]}>Xem bàn</Text><AppIcon name="chevron-forward" size={16} /></Pressable><ItemRow item={row.item} onServe={() => setConfirm({ sessionId: row.session.id, itemId: row.item.id, label: `${row.item.quantity} × ${row.item.name} cho bàn ${tableCode(state.tables, row.session.tableId)}` })} /></View>}
    ItemSeparatorComponent={() => <View style={{ height: 8 }} />} ListEmptyComponent={<EmptyState title="Đã mang hết món sẵn sàng" description="Món mới hoàn thành từ bếp sẽ xuất hiện tại đây." />} />
    {confirm && <ConfirmDialog title="Xác nhận đã phục vụ" message={`Bạn đã mang ${confirm.label} đến khách?`} onCancel={() => setConfirm(undefined)} onConfirm={() => { act({ type: "serve", sessionId: confirm.sessionId, itemId: confirm.itemId }); setConfirm(undefined); }} />}
  </Screen>;
}
