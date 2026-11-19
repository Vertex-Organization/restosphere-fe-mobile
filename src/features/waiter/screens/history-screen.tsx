import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { AppIcon, EmptyState, SearchInput, ui } from "@/components/ui";
import { colors, radius } from "@/theme";
import { useApp } from "@/store/app-store";
import { dateLabel, dateTimeLabel } from "@/utils/dates";
import { normalizeSearch } from "@/utils/search";
import { sessionItems } from "../selectors";
import { openTable } from "../components/service-ui";
import { tableCode } from "@/features/tables/labels";

export default function HistoryScreen() {
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const sessions = state.tableSessions.filter((s) => s.waiterId === state.session?.id && s.closedAt && normalizeSearch(`${tableCode(state.tables, s.tableId)} ${dateLabel(s.closedAt)}`).includes(normalizeSearch(query))).sort((a, b) => b.closedAt!.localeCompare(a.closedAt!));
  return <Screen scroll={false}><FlatList data={sessions} keyExtractor={(s) => s.id} contentContainerStyle={ui.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={{ gap: 12 }}><SearchInput value={query} onChangeText={setQuery} placeholder="Mã bàn hoặc ngày hoàn tất…" /><Text style={ui.caption}>{sessions.length} lượt hoàn tất · Mới nhất trước</Text></View>}
    renderItem={({ item: session }) => <Pressable accessibilityRole="button" accessibilityLabel={`Xem lượt phục vụ bàn ${tableCode(state.tables, session.tableId)}, ${dateLabel(session.closedAt!)}`} onPress={() => openTable(session)}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: pressed ? colors.surface : colors.white, borderRadius: radius.control, borderCurve: "continuous" })}>
      <View style={{ width: 54, alignItems: "center", gap: 4 }}><AppIcon name="checkmark-done-outline" size={20} color={colors.success} /><Text style={ui.label}>Bàn {tableCode(state.tables, session.tableId)}</Text></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[ui.label, { fontWeight: "600" }]}>{dateLabel(session.closedAt!)} · Đã hoàn tất</Text>
        <Text style={ui.caption}>{dateTimeLabel(session.acceptedAt ?? session.handedOverAt)} → {dateTimeLabel(session.closedAt!)}</Text>
        <Text style={[ui.caption, { color: colors.success }]}>{sessionItems(state, session.id).filter((item) => item.status === "SERVED").reduce((count, item) => count + item.quantity, 0)} phần đã phục vụ</Text>
      </View>
      <AppIcon name="chevron-forward" size={17} color={colors.muted} />
    </Pressable>}
    ItemSeparatorComponent={() => <View style={{ height: 6 }} />} ListEmptyComponent={<EmptyState title="Chưa có lượt hoàn tất phù hợp" description="Lượt được ghi nhận sau khi khách rời và bàn đã dọn xong." />} /></Screen>;
}
