import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { AppIcon, Button, EmptyState, Section, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { tableCode } from "@/features/tables/labels";
import { colors, radius } from "@/theme";
import { timeLabel } from "@/utils/dates";
import { FoodThumbnail } from "@/features/menu/components/food-thumbnail";
import { sessionBill, sessionItems, visibleSessions } from "../selectors";
import { SessionCard, openServiceScreen } from "../components/service-ui";

export default function WaiterOverviewScreen() {
  const { state } = useApp();
  const all = visibleSessions(state).filter((s) => !s.closedAt);
  const pending = all.filter((s) => !s.acceptedAt);
  const mine = all.filter((s) => s.waiterId === state.session?.id && !s.guestLeftAt);
  const items = mine.flatMap((s) => sessionItems(state, s.id));
  const ready = items.filter((i) => i.status === "READY").sort((a, b) => (a.readyAt ?? "").localeCompare(b.readyAt ?? ""));
  const readyCount = ready.reduce((n, i) => n + i.quantity, 0);
  const preparing = items.filter((i) => ["SUBMITTED", "PREPARING"].includes(i.status)).reduce((n, i) => n + i.quantity, 0);
  const payment = mine.filter((s) => sessionBill(state, s.id)?.status === "PAYMENT_REQUESTED");
  const serving = mine.filter((s) => s.acceptedAt && sessionBill(state, s.id)?.status !== "PAYMENT_REQUESTED");
  const metrics = [
    { label: "Bàn phụ trách", count: mine.length, color: colors.ink, onPress: () => router.navigate({ pathname: "/waiter/tables", params: { filter: "mine" } }) },
    { label: "Chờ nhận bàn", count: pending.length, color: colors.warning, onPress: () => router.navigate({ pathname: "/waiter/tables", params: { filter: "pending" } }) },
    { label: "Phần sẵn sàng", count: readyCount, color: colors.success, onPress: () => router.navigate("/waiter/ready") },
  ];

  return <Screen tabbed>
    <View style={[ui.row, { justifyContent: "space-between" }]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={ui.heading}>{state.session?.name}</Text>
        <Text style={ui.caption}>{state.session?.shift}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><AppIcon name="restaurant-outline" size={17} /><Text style={[ui.caption, { color: colors.primary }]}>Phục vụ bàn</Text></View>
    </View>

    <View style={{ backgroundColor: colors.white, borderRadius: radius.control, borderCurve: "continuous", flexDirection: "row" }}>
      {metrics.map((metric, index) => <Pressable key={metric.label} accessibilityRole="button" accessibilityLabel={`${metric.label}: ${metric.count}`} onPress={metric.onPress}
        style={({ pressed }) => ({ flex: 1, paddingHorizontal: 10, paddingVertical: 14, gap: 4, borderLeftWidth: index ? 1 : 0, borderLeftColor: colors.border, backgroundColor: pressed ? colors.surface : "transparent" })}>
        <Text selectable style={[ui.title, { color: metric.color, fontVariant: ["tabular-nums"] }]}>{metric.count.toString().padStart(2, "0")}</Text>
        <Text style={ui.caption}>{metric.label}</Text>
      </Pressable>)}
    </View>
    <View style={[ui.row, { gap: 6 }]}><AppIcon name="time-outline" size={16} color={colors.muted} /><Text style={ui.caption}>{preparing} phần chờ bếp</Text><Text style={ui.caption}>·</Text><Text style={ui.caption}>{payment.length} bàn chờ thanh toán</Text></View>

    <Pressable accessibilityRole="button" accessibilityLabel="Tra cứu thực đơn" onPress={() => router.push("/waiter/catalog")}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, padding: 12, borderRadius: radius.control, borderCurve: "continuous", backgroundColor: pressed ? colors.surface : colors.primarySoft })}>
      <AppIcon name="fish-outline" size={25} />
      <View style={{ flex: 1, gap: 2 }}><Text style={[ui.label, { color: colors.primary, fontWeight: "600" }]}>Tra cứu thực đơn</Text><Text style={ui.caption}>Ảnh, giá và thông tin tư vấn món</Text></View>
      <AppIcon name="arrow-forward-outline" size={19} />
    </Pressable>

    <Section title={`Món cần mang ra (${readyCount} phần)`}>
      {!!ready.length && <View style={{ backgroundColor: colors.white, borderRadius: radius.control, borderCurve: "continuous", overflow: "hidden" }}>
        {ready.slice(0, 3).map((item, index) => {
          const order = state.orders.find((o) => o.id === item.orderId)!;
          const session = mine.find((s) => s.id === order.sessionId)!;
          return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Mở món sẵn sàng, ${item.quantity} ${item.name}, bàn ${tableCode(state.tables, session.tableId)}`} onPress={() => router.navigate("/waiter/ready")}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", padding: 12, gap: 12, borderTopWidth: index ? 1 : 0, borderTopColor: colors.border, backgroundColor: pressed ? colors.surface : colors.white })}>
            <FoodThumbnail itemId={item.menuItemId} name={item.name} size={48} />
            <View style={{ flex: 1, gap: 3 }}><Text style={[ui.label, { fontWeight: "600" }]}>{item.quantity} × {item.name}</Text><Text style={[ui.caption, { color: colors.success }]}>Bàn {tableCode(state.tables, session.tableId)} · Bếp xong {item.readyAt ? timeLabel(item.readyAt) : ""}</Text></View>
            <AppIcon name="chevron-forward" size={17} color={colors.muted} />
          </Pressable>;
        })}
      </View>}
      {!ready.length && <Text style={ui.muted}>Chưa có món đang chờ mang ra.</Text>}
      {!!ready.length && <Button title="Mở món sẵn sàng" variant="secondary" onPress={() => router.navigate("/waiter/ready")} />}
    </Section>

    <Section title={`Bàn cần tiếp nhận (${pending.length})`}>
      {pending.length ? <View style={{ gap: 6 }}>{pending.map((session) => <SessionCard key={session.id} session={session} />)}</View> : <Text style={ui.muted}>Đã tiếp nhận hết bàn được bàn giao.</Text>}
    </Section>

    {!!payment.length && <Section title={`Bàn chờ thanh toán (${payment.length})`}>
      <View style={{ backgroundColor: colors.white, borderRadius: radius.control, borderCurve: "continuous", overflow: "hidden" }}>{payment.map((session, index) => <Pressable key={session.id} accessibilityRole="button" accessibilityLabel={`Xem thanh toán bàn ${tableCode(state.tables, session.tableId)}`} onPress={() => openServiceScreen("payment", session)}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, minHeight: 64, borderTopWidth: index ? 1 : 0, borderTopColor: colors.border, backgroundColor: pressed ? colors.surface : colors.white })}>
        <AppIcon name="receipt-outline" size={22} color={colors.warning} /><View style={{ flex: 1, gap: 3 }}><Text style={ui.label}>Bàn {tableCode(state.tables, session.tableId)}</Text><Text style={ui.caption}>Đang chờ thu ngân xử lý</Text></View><AppIcon name="chevron-forward" size={17} color={colors.muted} />
      </Pressable>)}</View>
    </Section>}

    <Section title={`Bàn đang phục vụ (${serving.length})`}>
      {serving.length ? <View style={{ gap: 6 }}>{serving.map((session) => <SessionCard key={session.id} session={session} />)}</View> : <EmptyState title="Chưa có bàn đang phục vụ" description="Tiếp nhận bàn khi lễ tân bàn giao cho bạn." />}
    </Section>
    <Button title="Xem tất cả bàn" variant="secondary" onPress={() => router.navigate({ pathname: "/waiter/tables", params: { filter: "all" } })} />
  </Screen>;
}
