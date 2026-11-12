import { useState } from "react";
import { Text } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Button, ConfirmDialog, DetailRow, Message, Section, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { hasPermission } from "@/features/auth/permissions";
import { PAYMENT_LABELS } from "@/features/orders/labels";
import { TABLE_LABELS } from "@/features/tables/labels";
import { sessionBill } from "../selectors";
import { MissingSession, SessionHeading, openServiceScreen, useServiceSession, useWaiterAction } from "../components/service-ui";
import { dateTimeLabel } from "@/utils/dates";

export default function FinishScreen() {
  const { state } = useApp();
  const session = useServiceSession();
  const { act, error } = useWaiterAction();
  const [confirm, setConfirm] = useState<"guest-left" | "clean">();
  if (!session) return <MissingSession />;
  const table = state.tables.find((t) => t.id === session.tableId)!;
  const bill = sessionBill(state, session.id)!;
  return <Screen><SessionHeading session={session} />
    {!!error && <Message>{error}</Message>}
    <Section title="Kiểm tra trước khi trả bàn"><DetailRow label="Thanh toán" value={PAYMENT_LABELS[bill.status]} /><DetailRow label="Khách tại bàn" value={session.guestLeftAt ? `Đã rời · ${dateTimeLabel(session.guestLeftAt)}` : "Khách còn tại bàn"} /><DetailRow label="Trạng thái bàn" value={session.closedAt ? "Lượt đã kết thúc" : TABLE_LABELS[table.status]} /></Section>
    {bill.status !== "PAID" && <><Message kind="info">Cần thu ngân xác nhận thanh toán trước khi kết thúc phục vụ.</Message><Button title="Xem yêu cầu thanh toán" variant="secondary" onPress={() => openServiceScreen("payment", session)} /></>}
    {bill.status === "PAID" && !session.guestLeftAt && <><Text style={ui.text}>Chỉ xác nhận sau khi quan sát thấy toàn bộ khách đã rời bàn.</Text><Button title="Xác nhận khách đã rời bàn" disabled={!hasPermission(state.session, "table.mark_guest_left")} onPress={() => setConfirm("guest-left")} /></>}
    {!!session.guestLeftAt && !session.closedAt && <><Message kind="info">Bàn đang dọn. Kiểm tra mặt bàn, ghế và dụng cụ trước khi đánh dấu sẵn sàng.</Message><Button title="Xác nhận bàn đã dọn xong" disabled={!hasPermission(state.session, "table.mark_cleaned")} onPress={() => setConfirm("clean")} /></>}
    {!!session.closedAt && <Message kind="success">Đã hoàn tất phục vụ lúc {dateTimeLabel(session.closedAt)}. Lượt đã được lưu vào lịch sử.</Message>}
    {confirm && <ConfirmDialog title={confirm === "guest-left" ? "Khách thực sự đã rời bàn?" : "Bàn thực sự đã dọn xong?"} message={confirm === "guest-left" ? "Xác nhận toàn bộ khách đã rời. Bàn sẽ chuyển sang Đang dọn, chưa sẵn sàng đón khách mới." : "Xác nhận bàn, ghế và dụng cụ đã được chuẩn bị. Lượt sử dụng sẽ kết thúc và bàn trở về Sẵn sàng nếu đủ điều kiện."} onCancel={() => setConfirm(undefined)} onConfirm={() => { act({ type: confirm, sessionId: session.id, confirmed: true }); setConfirm(undefined); }} />}
  </Screen>;
}
