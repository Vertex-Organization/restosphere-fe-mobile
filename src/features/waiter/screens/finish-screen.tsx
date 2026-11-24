import { Screen } from "@/components/layout/screen";
import { Button, DetailRow, Message, Section } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { PAYMENT_LABELS } from "@/features/orders/labels";
import { sessionBill } from "../selectors";
import { MissingSession, SessionHeading, openServiceScreen, useServiceSession } from "../components/service-ui";
import { dateTimeLabel } from "@/utils/dates";

export default function FinishScreen() {
  const { state, retrySave } = useApp();
  const session = useServiceSession();
  if (!session) return <MissingSession />;
  const bill = sessionBill(state, session.id);
  return (
    <Screen>
      <SessionHeading session={session} />
      <Section title="Kết thúc phục vụ">
        <DetailRow label="Thanh toán" value={bill ? PAYMENT_LABELS[bill.status] : "Hóa đơn ghép · kiểm tra với thu ngân"} />
        {session.closedAt ? <Message kind="success">Phiên đã đóng lúc {dateTimeLabel(session.closedAt)}. Thanh toán hoàn tất tự đóng các phiên và trả bàn; không cần xác nhận khách rời hoặc dọn bàn.</Message> : <Message kind="info">Khi hóa đơn được thanh toán đủ, máy chủ tự đóng các phiên liên quan và trả bàn.</Message>}
      </Section>
      {!session.closedAt && <Button title="Xem yêu cầu thanh toán" onPress={() => openServiceScreen("payment", session)} />}
      <Button title="Tải lại trạng thái" variant="secondary" onPress={retrySave} />
    </Screen>
  );
}
