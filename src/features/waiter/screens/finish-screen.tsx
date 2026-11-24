import { Screen } from "@/components/layout/screen";
import { Button, DetailRow, Message, Section } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { PAYMENT_LABELS } from "@/features/orders/labels";
import { needsCleaning, sessionBill } from "../selectors";
import {
  MissingSession,
  SessionHeading,
  openServiceScreen,
  useServiceSession,
  useWaiterAction,
} from "../components/service-ui";
import { dateTimeLabel } from "@/utils/dates";

export default function FinishScreen() {
  const { state, retrySave } = useApp();
  const session = useServiceSession();
  const { act, error } = useWaiterAction();
  if (!session) return <MissingSession />;
  const bill = sessionBill(state, session.id);
  const cleaning = needsCleaning(state, session);
  return (
    <Screen>
      <SessionHeading session={session} />
      <Section title="Kết thúc phục vụ">
        <DetailRow
          label="Thanh toán"
          value={bill ? PAYMENT_LABELS[bill.status] : "Hóa đơn ghép · kiểm tra với thu ngân"}
        />
        {cleaning ? (
          <Message kind="info">
            Đã thanh toán lúc {dateTimeLabel(session.closedAt!)}. Phiên đã đóng, bàn đang chờ dọn.
            Bấm Đã dọn khi bàn sạch để lễ tân xếp khách mới.
          </Message>
        ) : session.closedAt ? (
          <Message kind="success">
            Phiên đã đóng lúc {dateTimeLabel(session.closedAt)}. Bàn đã dọn xong.
          </Message>
        ) : (
          <Message kind="info">
            Khi hóa đơn được thanh toán đủ, máy chủ tự đóng mọi phiên của hóa đơn và chuyển bàn sang
            chờ dọn.
          </Message>
        )}
        {error ? <Message kind="error">{error}</Message> : null}
      </Section>
      {cleaning && !session.guestLeftAt && (
        <Button
          title="Khách đã về (không bắt buộc)"
          variant="secondary"
          onPress={() => act({ type: "guest-left", sessionId: session.id, confirmed: true })}
        />
      )}
      {cleaning && (
        <Button
          title="Đã dọn"
          onPress={() => act({ type: "clean", sessionId: session.id, confirmed: true })}
        />
      )}
      {!session.closedAt && (
        <Button
          title="Xem yêu cầu thanh toán"
          onPress={() => openServiceScreen("payment", session)}
        />
      )}
      <Button title="Tải lại trạng thái" variant="secondary" onPress={retrySave} />
    </Screen>
  );
}
