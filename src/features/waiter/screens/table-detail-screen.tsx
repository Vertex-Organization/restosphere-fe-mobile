import { Text, View } from "react-native";
import { SessionOperations } from "../components/session-operations";
import { Screen } from "@/components/layout/screen";
import { Button, EmptyState, Message, Section, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { dateTimeLabel } from "@/utils/dates";
import { canOrder, sessionBill, sessionDrafts, sessionItems, sessionTotal } from "../selectors";
import { PAYMENT_LABELS } from "@/features/orders/labels";
import {
  AmountRow,
  ItemRow,
  MissingSession,
  SessionHeading,
  openServiceScreen,
  useServiceSession,
  useWaiterAction,
} from "../components/service-ui";

export default function WaiterTableDetailScreen() {
  const { state } = useApp();
  const session = useServiceSession();
  const { act, error } = useWaiterAction();
  if (!session) return <MissingSession />;
  const r = state.reservations.find((r) => r.id === session.reservationId)!;
  const bill = sessionBill(state, session.id);
  const mine = session.waiterId === state.session?.id;
  const items = sessionItems(state, session.id);
  const drafts = sessionDrafts(state, session.id);
  return (
    <Screen>
      <SessionHeading session={session} />
      {!!error && <Message>{error}</Message>}
      {!session.acceptedAt && (
        <Button
          title="Tiếp nhận phục vụ bàn"
          icon="hand-left-outline"
          onPress={() => act({ type: "accept", sessionId: session.id })}
        />
      )}
      {canOrder(state, session) && (
        <Button
          title={items.length ? "Gọi thêm món" : "Gọi món cho bàn"}
          icon="add-outline"
          onPress={() => openServiceScreen("menu", session)}
        />
      )}
      {!!drafts.length && canOrder(state, session) && (
        <Button
          title={`Mở giỏ · ${drafts.reduce((n, d) => n + d.quantity, 0)} phần chưa gửi`}
          variant="secondary"
          onPress={() => openServiceScreen("cart", session)}
        />
      )}
      <SessionOperations session={session} />
      <Section title="Thông tin bàn giao">
        <Text style={ui.text}>{r?.customer.name ?? "Khách tách bàn"}</Text>
        <Text style={ui.muted}>Lễ tân bàn giao {dateTimeLabel(session.handedOverAt)}</Text>
        <Text style={ui.text}>
          {[r?.notes, r?.specialRequests].filter(Boolean).join("\n") || "Không có ghi chú bàn giao."}
        </Text>
        <Text style={ui.muted}>
          Phụ trách:{" "}
          {state.employees.find((e) => e.id === session.waiterId)?.name ?? "Chưa tiếp nhận"}
        </Text>
      </Section>
      <Section title={`Danh sách món (${items.length})`}>
        {items.length ? (
          items.map((i) => (
            <ItemRow
              key={i.id}
              item={i}
              onServe={
                mine && !session.closedAt
                  ? () => act({ type: "serve", sessionId: session.id, itemId: i.id })
                  : undefined
              }
            />
          ))
        ) : (
          <EmptyState
            title="Bàn chưa gọi món"
            description={
              session.acceptedAt
                ? "Mở thực đơn để chọn món cho khách."
                : "Tiếp nhận bàn trước khi gọi món."
            }
          />
        )}
      </Section>
      <View style={ui.panel}>
        <AmountRow label="Tổng tạm tính" amount={sessionTotal(state, session.id)} />
        <Text style={ui.text}>{PAYMENT_LABELS[bill?.status ?? "UNPAID"]}</Text>
      </View>
      {mine && (
        <>
          <Button
            title="Xem tiến độ từng lượt"
            variant="secondary"
            onPress={() => openServiceScreen("progress", session)}
          />
          <Button
            title="Xem yêu cầu thanh toán"
            variant="secondary"
            onPress={() => openServiceScreen("payment", session)}
          />
          {(bill?.status === "PAID" || session.closedAt) && (
            <Button
              title="Xem kết thúc phục vụ"
              variant="secondary"
              onPress={() => openServiceScreen("finish", session)}
            />
          )}
        </>
      )}
    </Screen>
  );
}
