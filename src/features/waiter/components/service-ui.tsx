import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AppIcon, Button, EmptyState, Field, Message, ui, type IconName } from "@/components/ui";
import { Screen } from "@/components/layout/screen";
import { useApp } from "@/store/app-store";
import { colors, radius } from "@/theme";
import { timeLabel } from "@/utils/dates";
import { ITEM_LABELS } from "@/features/orders/labels";
import type { Order, OrderItem } from "@/features/orders/types";
import { FoodThumbnail } from "@/features/menu/components/food-thumbnail";
import {
  canOrder,
  canViewSession,
  money,
  serviceLabel,
  sessionBill,
  sessionItems,
} from "../selectors";
import type { TableSession, WaiterCommand } from "../types";

export function useWaiterAction() {
  const { runWaiter } = useApp();
  const [error, setError] = useState("");
  async function act(command: WaiterCommand, then?: () => void) {
    try {
      await runWaiter(command);
      setError("");
      then?.();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return { act, error, setError };
}
export function PriorityRequest({ session, order }: { session: TableSession; order: Order }) {
  const { act, error } = useWaiterAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (order.priority)
    return <Text style={ui.caption}>Đã yêu cầu ưu tiên: {order.priority.reason}</Text>;
  if (!open)
    return <Button title="Yêu cầu ưu tiên" variant="secondary" onPress={() => setOpen(true)} />;
  return (
    <View style={{ gap: 8 }}>
      <Field
        label="Lý do ưu tiên"
        multiline
        maxLength={200}
        value={reason}
        onChangeText={setReason}
      />
      {!!error && <Message>{error}</Message>}
      <Button
        title="Gửi yêu cầu ưu tiên"
        onPress={() =>
          act(
            { type: "request-priority", sessionId: session.id, orderId: order.id, reason },
            () => {
              setOpen(false);
              setReason("");
            },
          )
        }
      />
      <Button title="Quay lại" variant="secondary" onPress={() => setOpen(false)} />
    </View>
  );
}
export function useServiceSession() {
  const { id, sessionId } = useLocalSearchParams<{ id?: string; sessionId?: string }>();
  const { state } = useApp();
  const session = state.tableSessions.find((s) => s.id === (sessionId ?? id));
  return session && canViewSession(state, session) ? session : undefined;
}
export function MissingSession() {
  return (
    <Screen>
      <EmptyState
        title="Không thể mở lượt phục vụ"
        description="Lượt không tồn tại hoặc bạn không có quyền xem."
      />
      <Button title="Về danh sách bàn" onPress={() => router.replace("/waiter/tables")} />
    </Screen>
  );
}
export const openTable = (session: TableSession) =>
  router.push({ pathname: "/waiter/tables/[id]", params: { id: session.id } });
export function openServiceScreen(
  screen: "menu" | "cart" | "progress" | "payment" | "finish",
  session: TableSession,
) {
  router.push({ pathname: `/waiter/${screen}`, params: { sessionId: session.id } });
}
export function StatusTag({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "info" | "danger";
  icon?: IconName;
}) {
  const [bg, ink] =
    tone === "success"
      ? [colors.successSoft, colors.success]
      : tone === "warning"
        ? [colors.warningSoft, colors.warning]
        : tone === "info"
          ? [colors.infoSoft, colors.info]
          : tone === "danger"
            ? [colors.dangerSoft, colors.danger]
            : [colors.surface, colors.muted];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: radius.badge,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: bg,
      }}
    >
      <AppIcon
        name={
          icon ??
          (tone === "success"
            ? "checkmark-circle-outline"
            : tone === "warning"
              ? "time-outline"
              : tone === "info"
                ? "information-circle-outline"
                : "ellipse-outline")
        }
        size={15}
        color={ink}
      />
      <Text style={[ui.caption, { color: ink, fontWeight: "600", flexShrink: 1 }]}>{label}</Text>
    </View>
  );
}
export function SessionHeading({ session }: { session: TableSession }) {
  const { state } = useApp();
  const table = state.tables.find((t) => t.id === session.tableId)!;
  const reservation = state.reservations.find((r) => r.id === session.reservationId)!;
  const bill = sessionBill(state, session.id);
  const tone =
    session.guestLeftAt || session.closedAt
      ? "neutral"
      : !session.acceptedAt || bill?.status === "PAYMENT_REQUESTED"
        ? "warning"
        : bill?.status === "PAID"
          ? "success"
          : "info";
  const icon: IconName = session.closedAt
    ? "checkmark-done-outline"
    : session.guestLeftAt
      ? "sparkles-outline"
      : !session.acceptedAt
        ? "hand-left-outline"
        : bill?.status === "PAYMENT_REQUESTED"
          ? "receipt-outline"
          : bill?.status === "PAID"
            ? "checkmark-circle-outline"
            : "people-outline";
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={ui.title}>
        Bàn {table.code}
      </Text>
      <Text style={ui.muted}>
        {state.areas.find((a) => a.id === table.areaId)?.name} ·{" "}
        {session.guests ?? reservation?.actualGuests ?? reservation?.guests ?? "—"} khách · Vào{" "}
        {timeLabel(reservation?.arrivedAt ?? session.handedOverAt)}
      </Text>
      <StatusTag label={serviceLabel(state, session)} tone={tone} icon={icon} />
    </View>
  );
}
export function SessionCard({ session }: { session: TableSession }) {
  const { state } = useApp();
  const table = state.tables.find((t) => t.id === session.tableId)!;
  const r = state.reservations.find((r) => r.id === session.reservationId)!;
  const items = sessionItems(state, session.id);
  const remaining = items
    .filter((i) => !["SERVED", "REJECTED", "CANCELLED", "VOIDED"].includes(i.status))
    .reduce((n, i) => n + i.quantity, 0);
  const ready = items.filter((i) => i.status === "READY").reduce((n, i) => n + i.quantity, 0);
  const bill = sessionBill(state, session.id);
  const tone =
    session.guestLeftAt || session.closedAt
      ? colors.muted
      : !session.acceptedAt || bill?.status === "PAYMENT_REQUESTED"
        ? colors.warning
        : ready || bill?.status === "PAID"
          ? colors.success
          : colors.primary;
  const icon: IconName = session.closedAt
    ? "checkmark-done-outline"
    : session.guestLeftAt
      ? "sparkles-outline"
      : !session.acceptedAt
        ? "hand-left-outline"
        : bill?.status === "PAYMENT_REQUESTED"
          ? "receipt-outline"
          : bill?.status === "PAID"
            ? "checkmark-circle-outline"
            : ready
              ? "restaurant-outline"
              : "people-outline";
  const action = session.closedAt
    ? "Lượt phục vụ đã hoàn tất"
    : session.guestLeftAt
      ? "Chờ xác nhận dọn xong"
      : !session.acceptedAt
        ? `Bàn giao ${timeLabel(session.handedOverAt)} · Nhận bàn`
        : ready
          ? `${ready} phần sẵn sàng${remaining > ready ? ` · ${remaining - ready} phần chờ bếp` : ""}`
          : bill?.status === "PAYMENT_REQUESTED"
            ? "Theo dõi phản hồi từ thu ngân"
            : bill?.status === "PAID"
              ? "Khách vẫn đang tại bàn"
              : remaining
                ? `${remaining} phần đang chờ bếp`
                : items.length
                  ? "Đã phục vụ đủ món"
                  : "Chưa gọi món · Mở thực đơn";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở bàn ${table.code}, ${serviceLabel(state, session)}`}
      onPress={() => openTable(session)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: pressed ? colors.surface : colors.white,
        borderRadius: radius.control,
        borderCurve: "continuous",
        borderLeftWidth: 3,
        borderLeftColor: tone,
      })}
    >
      <View style={{ width: 54, alignItems: "center", gap: 3 }}>
        <AppIcon name={icon} size={20} color={tone} />
        <Text selectable style={[ui.heading, { fontVariant: ["tabular-nums"] }]}>
          {table.code}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[ui.label, { color: tone, fontWeight: "600" }]}>
          {serviceLabel(state, session)}
        </Text>
        <Text style={ui.muted}>
          {state.areas.find((a) => a.id === table.areaId)?.name} · {session.guests ?? r?.actualGuests ?? r?.guests ?? "—"}{" "}
          khách
        </Text>
        <Text style={ui.caption}>
          {r?.customer.name ?? "Khách tách bàn"} ·{" "}
          {session.acceptedAt ? timeLabel(session.acceptedAt) : timeLabel(session.handedOverAt)}
        </Text>
        <Text
          style={[
            ui.caption,
            { color: ready ? colors.success : colors.ink, fontWeight: ready ? "600" : "400" },
          ]}
        >
          {action}
        </Text>
      </View>
      <AppIcon name="chevron-forward" size={17} color={colors.muted} />
    </Pressable>
  );
}
export function ItemRow({ item, onServe }: { item: OrderItem; onServe?: () => void }) {
  const { state } = useApp();
  const { act, error } = useWaiterAction();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const order = state.orders.find((o) => o.id === item.orderId);
  const session = state.tableSessions.find((s) => s.id === order?.sessionId);
  const request = state.requests.find((r) => r.itemId === item.id);
  const canCancel =
    session &&
    canOrder(state, session) &&
    ["PREPARING", "READY"].includes(item.status) &&
    request?.status !== "PENDING";
  const icon: IconName =
    item.status === "READY"
      ? "restaurant-outline"
      : item.status === "PREPARING"
        ? "flame-outline"
        : item.status === "SERVED"
          ? "checkmark-done-outline"
          : item.status === "CANCELLED"
            ? "close-circle-outline"
            : "send-outline";
  return (
    <View
      style={{
        gap: 9,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <FoodThumbnail itemId={item.menuItemId} name={item.name} size={56} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[ui.text, { fontWeight: "600" }]}>
            {item.quantity} × {item.name}
          </Text>
          <Text selectable style={[ui.label, { fontVariant: ["tabular-nums"] }]}>
            {money(item.unitPrice * item.quantity)}
          </Text>
          <StatusTag
            label={ITEM_LABELS[item.status]}
            icon={icon}
            tone={
              item.status === "READY" || item.status === "SERVED"
                ? "success"
                : item.status === "PREPARING"
                  ? "warning"
                  : item.status === "CANCELLED"
                    ? "danger"
                    : "info"
            }
          />
        </View>
      </View>
      {!!item.note && <Text style={ui.label}>Ghi chú: {item.note}</Text>}
      {!!item.rejectionReason && <Message>{item.rejectionReason}</Message>}
      {request && (
        <Text style={ui.caption}>
          Yêu cầu hủy ·{" "}
          {request.status === "PENDING"
            ? "Chờ duyệt"
            : request.status === "APPROVED"
              ? "Đã duyệt"
              : "Từ chối"}
          {request.decisionNote ? ` · ${request.decisionNote}` : ""}
        </Text>
      )}
      {!!error && <Message>{error}</Message>}
      {canCancel &&
        (cancelling ? (
          <View style={{ gap: 8 }}>
            <Field
              label="Lý do hủy"
              multiline
              maxLength={200}
              value={reason}
              onChangeText={setReason}
            />
            <Button
              title="Gửi yêu cầu hủy"
              onPress={() =>
                act(
                  { type: "request-cancel", sessionId: session.id, itemId: item.id, reason },
                  () => {
                    setCancelling(false);
                    setReason("");
                  },
                )
              }
            />
            <Button title="Quay lại" variant="secondary" onPress={() => setCancelling(false)} />
          </View>
        ) : (
          <Button title="Yêu cầu hủy" variant="secondary" onPress={() => setCancelling(true)} />
        ))}
      {!!item.cancellationReason && <Message>{item.cancellationReason}</Message>}
      <Text style={ui.caption}>
        Gửi {timeLabel(item.submittedAt)}
        {item.readyAt ? ` · Xong ${timeLabel(item.readyAt)}` : ""}
        {item.servedAt ? ` · Phục vụ ${timeLabel(item.servedAt)}` : ""}
      </Text>
      {item.status === "READY" && onServe && (
        <Button title="Xác nhận đã phục vụ" icon="checkmark-outline" onPress={onServe} />
      )}
    </View>
  );
}
export function AmountRow({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={[ui.row, { justifyContent: "space-between", paddingVertical: 10 }]}>
      <Text style={ui.heading}>{label}</Text>
      <Text
        selectable
        style={[ui.heading, { color: colors.primary, fontVariant: ["tabular-nums"] }]}
      >
        {money(amount)}
      </Text>
    </View>
  );
}
