import { useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { AppIcon, Button, EmptyState, FilterChip, Message, SearchInput, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors, layout, radius, spacing } from "@/theme";
import { normalizeSearch } from "@/utils/search";
import { canOrder, money, sessionDrafts } from "@/features/waiter/selectors";
import { MissingSession, SessionHeading, openServiceScreen, useServiceSession, useWaiterAction } from "@/features/waiter/components/service-ui";
import { FoodThumbnail } from "../components/food-thumbnail";

/** The consultation catalog and ordering screen share the same live menu and availability. */
export default function OrderMenuScreen({ browse = false }: { browse?: boolean }) {
  const { state } = useApp();
  const session = useServiceSession();
  const { act, error } = useWaiterAction();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!browse && !session) return <MissingSession />;
  if (!browse && session && !canOrder(state, session)) return <Screen><SessionHeading session={session} /><Message kind="info">Bàn chưa tiếp nhận, đã kết thúc hoặc đang khóa gọi thêm món để thanh toán.</Message><Button title="Xem thông tin thanh toán" variant="secondary" onPress={() => openServiceScreen("payment", session)} /></Screen>;
  const drafts = !browse && session ? sessionDrafts(state, session.id) : [];
  const count = drafts.reduce((n, d) => n + d.quantity, 0);
  const total = drafts.reduce((n, d) => n + d.quantity * (state.menuItems.find((m) => m.id === d.menuItemId)?.price ?? 0), 0);
  const search = normalizeSearch(query);
  const data = state.menuItems.filter((m) => (category === "all" || m.categoryId === category) && normalizeSearch(`${m.name} ${m.notes}`).includes(search));
  return <Screen scroll={false}>
    <FlatList data={data} keyExtractor={(m) => m.id} contentContainerStyle={[ui.content, { gap: 0 }]} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic"
      ListHeaderComponent={<View style={{ gap: spacing.compact, paddingBottom: spacing.sm }}>
        {browse ? <View style={{ gap: spacing.xs }}>
          <View style={[ui.row, { gap: spacing.sm }]}><AppIcon name="fish-outline" size={22} /><Text accessibilityRole="header" style={ui.heading}>Thực đơn hải sản</Text></View>
          <Text style={ui.muted}>Xem giá, thành phần và tình trạng món để tư vấn khách.</Text>
        </View> : session && <SessionHeading session={session} />}
        <SearchInput value={query} onChangeText={setQuery} placeholder="Tìm tên món hoặc thành phần…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }} keyboardShouldPersistTaps="handled">
          {[{ id: "all", name: "Tất cả" }, ...state.menuCategories].map((c) => <FilterChip key={c.id} title={c.name} selected={category === c.id} onPress={() => setCategory(c.id)} />)}
        </ScrollView>
        <Text accessibilityLiveRegion="polite" style={ui.caption}>{data.length} món{category !== "all" ? ` · ${state.menuCategories.find((c) => c.id === category)?.name}` : " trong thực đơn"}</Text>
        {!!error && <Message>{error}</Message>}
      </View>}
      renderItem={({ item }) => {
        const rows = drafts.filter((d) => d.menuItemId === item.id);
        const quantity = rows.reduce((n, d) => n + d.quantity, 0);
        const available = item.status === "AVAILABLE";
        const detail = expanded === item.id;
        const decrease = () => {
          const last = rows[rows.length - 1];
          if (!last || !session) return;
          act(last.quantity === 1
            ? { type: "remove-draft", sessionId: session.id, draftId: last.id }
            : { type: "edit-draft", sessionId: session.id, draftId: last.id, quantity: last.quantity - 1, note: last.note });
        };
        return <View style={{ paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Thông tin món ${item.name}`} accessibilityState={{ expanded: detail }} onPress={() => setExpanded(detail ? null : item.id)}
            style={({ pressed }) => ({ flexDirection: "row", gap: spacing.compact, alignItems: "flex-start", opacity: pressed ? 0.7 : 1 })}>
            <View style={{ opacity: available ? 1 : 0.6 }}><FoodThumbnail itemId={item.id} name={item.name} size={72} /></View>
            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.xs }}><Text style={[ui.text, { flex: 1, fontWeight: "600" }]}>{item.name}</Text><AppIcon name={detail ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.muted} /></View>
              <Text selectable style={[ui.label, { color: colors.primary, fontWeight: "700", fontVariant: ["tabular-nums"] }]}>{money(item.price)}</Text>
              {!detail && <Text style={ui.caption} numberOfLines={2}>{item.notes}</Text>}
            </View>
          </Pressable>
          {detail && <View style={{ padding: spacing.compact, gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.control }}>
            <Text style={ui.caption}>Nhóm món · {state.menuCategories.find((c) => c.id === item.categoryId)?.name}</Text>
            <Text style={ui.text}>{item.notes}</Text>
          </View>}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, flexWrap: "wrap" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: browse ? 24 : 44 }}>
              <AppIcon name={available ? "checkmark-circle-outline" : "remove-circle-outline"} size={16} color={available ? colors.success : colors.warning} />
              <Text style={[ui.caption, { color: available ? colors.success : colors.warning, fontWeight: available ? "400" : "600" }]}>{available ? "Còn bán" : item.status === "SOLD_OUT" ? "Tạm hết món" : "Ngừng bán"}</Text>
            </View>
            {!browse && session && <Button title={quantity ? `Thêm · ${quantity}` : "Thêm món"} accessibilityLabel={`Thêm ${item.name}, ${quantity} phần trong giỏ`} icon="add-outline" disabled={!available} size="sm" variant={quantity ? "primary" : "secondary"} onPress={() => act({ type: "add-draft", sessionId: session.id, menuItemId: item.id })} />}
          </View>
          {!!quantity && session && <View style={[ui.row, { gap: spacing.sm }]}><Button title="Giảm một phần" accessibilityLabel={`Giảm một phần ${item.name}`} size="sm" variant="secondary" onPress={decrease} /><Button title="Sửa ghi chú" accessibilityLabel={`Sửa ghi chú ${item.name} trong giỏ`} size="sm" icon="create-outline" variant="secondary" onPress={() => openServiceScreen("cart", session)} /></View>}
        </View>;
      }} ListEmptyComponent={<EmptyState title="Không tìm thấy món" description="Thử tên món khác hoặc chọn danh mục Tất cả." />} />
    {!browse && session && <View style={{ paddingHorizontal: layout.pagePadding, paddingTop: spacing.compact, paddingBottom: spacing.compact, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white }}>
      <View style={{ width: "100%", maxWidth: layout.maxWidth - layout.pagePadding * 2, alignSelf: "center", gap: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}><Text style={ui.label}>{count} phần trong giỏ</Text><Text style={[ui.label, { color: colors.primary, fontWeight: "700" }]}>{money(total)}</Text></View>
        <Button title="Xem giỏ và ghi chú món" icon="bag-outline" disabled={!count} onPress={() => openServiceScreen("cart", session)} />
      </View>
    </View>}
  </Screen>;
}
