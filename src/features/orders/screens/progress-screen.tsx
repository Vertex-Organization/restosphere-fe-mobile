import { useState } from "react";
import { Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { EmptyState, FilterChip, Message, Section, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { ITEM_LABELS } from "../labels";
import { canOrder, sessionItems } from "@/features/waiter/selectors";
import { ItemRow, MissingSession, PriorityRequest, SessionHeading, useServiceSession, useWaiterAction } from "@/features/waiter/components/service-ui";

export default function ProgressScreen() {
  const { state } = useApp();
  const session = useServiceSession();
  const { act, error } = useWaiterAction();
  const [filter, setFilter] = useState("all");
  if (!session) return <MissingSession />;
  const items = sessionItems(state, session.id).filter((i) => filter === "all" || i.status === filter);
  return <Screen><SessionHeading session={session} /><View style={ui.row}>{["all", "SUBMITTED", "PREPARING", "READY", "SERVED", "REJECTED", "CANCELLED", "VOIDED"].map((status) => <FilterChip key={status} title={status === "all" ? "Tất cả" : ITEM_LABELS[status as keyof typeof ITEM_LABELS]} selected={filter === status} onPress={() => setFilter(status)} />)}</View>
    {!!error && <Message>{error}</Message>}
    {state.orders.filter((o) => o.sessionId === session.id).map((order) => { const batch = items.filter((i) => i.orderId === order.id); return !!batch.length && <Section key={order.id} title={`Lượt gọi món ${order.sequence}`}>{batch.map((i) => <ItemRow key={i.id} item={i} onServe={session.waiterId === state.session?.id && !session.closedAt ? () => act({ type: "serve", sessionId: session.id, itemId: i.id }) : undefined} />)}{canOrder(state, session) && batch.some((i) => ["SUBMITTED", "PREPARING"].includes(i.status)) && <PriorityRequest session={session} order={order} />}</Section>; })}
    {!items.length && <EmptyState title="Không có món ở trạng thái này" description="Chọn trạng thái khác hoặc gửi món từ giỏ." />}<Text style={ui.caption}>Trạng thái chế biến được cập nhật từ bếp. Nhân viên phục vụ chỉ xác nhận món đã mang ra bàn.</Text>
  </Screen>;
}
