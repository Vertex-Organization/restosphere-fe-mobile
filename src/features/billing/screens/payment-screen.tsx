import { useState } from "react";
import { Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Button, ConfirmDialog, EmptyState, Message, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { tableCode } from "@/features/tables/labels";
import { PAYMENT_LABELS } from "@/features/orders/labels";
import {
  canOrder,
  paymentBlockReason,
  sessionBill,
  sessionDrafts,
  sessionItems,
  sessionTotal,
} from "@/features/waiter/selectors";
import {
  AmountRow,
  ItemRow,
  MissingSession,
  SessionHeading,
  StatusTag,
  openServiceScreen,
  useServiceSession,
  useWaiterAction,
} from "@/features/waiter/components/service-ui";
import { dateTimeLabel } from "@/utils/dates";
import { PaymentQr } from "@/components/ui/payment-qr";

export default function PaymentScreen() {
  const { state } = useApp();
  const session = useServiceSession();
  const { act, error } = useWaiterAction();
  const [confirm, setConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  if (!session) return <MissingSession />;
  if (!session.acceptedAt)
    return (
      <Screen>
        <SessionHeading session={session} />
        <Message kind="info">Cần tiếp nhận phục vụ trước khi xem yêu cầu thanh toán.</Message>
      </Screen>
    );
  const bill = sessionBill(state, session.id);
  if (!bill) return (
    <Screen>
      <SessionHeading session={session} />
      <Message kind="info">Phiên dùng hóa đơn ghép. Máy chủ chưa cung cấp liên kết hóa đơn cho phiên này; hãy kiểm tra tổng với thu ngân.</Message>
      {!!error && <Message>{error}</Message>}
      {!session.closedAt && <Button title={session.paymentRequested ? "Rút yêu cầu thanh toán" : "Gửi yêu cầu thanh toán"} onPress={() => act({ type: session.paymentRequested ? "withdraw-payment-request" : "request-payment", sessionId: session.id })} />}
    </Screen>
  );
  const reason = paymentBlockReason(state, session);
  const items = sessionItems(state, session.id);
  const currentTotal = bill.currentAmount ?? sessionTotal(state, session.id);
  const diff = bill.requestedAmount != null ? currentTotal - bill.requestedAmount : 0;
  return (
    <Screen>
      <SessionHeading session={session} />
      <StatusTag
        label={PAYMENT_LABELS[bill.status]}
        tone={bill.status === "PAID" ? "success" : "warning"}
      />
      {!!error && <Message>{error}</Message>}
      {items.map((i) => (
        <ItemRow key={i.id} item={i} />
      ))}
      {!items.length && (
        <EmptyState
          title="Chưa có món để thanh toán"
          description="Gọi món và hoàn tất phục vụ trước khi gửi yêu cầu."
        />
      )}
      <View style={ui.panel}>
        <AmountRow label="Tổng hiện tại" amount={currentTotal} />
        {bill.status === "PAYMENT_REQUESTED" && bill.requestedAmount != null && diff !== 0 && (
          <Message kind="info">
            Số tiền lúc gửi yêu cầu: {bill.requestedAmount.toLocaleString("vi-VN")} ₫ · Chênh lệch:{" "}
            {diff > 0 ? `+${diff.toLocaleString("vi-VN")}` : diff.toLocaleString("vi-VN")} ₫
          </Message>
        )}
        <Text style={ui.caption}>
          Món hủy không tính tiền. Thu ngân xử lý hóa đơn và xác nhận thanh toán.
        </Text>
      </View>
      {bill.status !== "PAID" && !!bill.payos?.qrCode && (
        <View style={ui.panel}>
          <Text style={ui.caption}>Quét mã thanh toán hóa đơn do thu ngân tạo.</Text>
          <PaymentQr value={bill.payos.qrCode} />
        </View>
      )}
      {bill.status === "UNPAID" && (
        <>
          {!!reason && <Message kind="info">{reason}</Message>}
          <Button
            title="Gửi yêu cầu thanh toán"
            disabled={!!reason}
            onPress={() => setConfirm(true)}
          />
        </>
      )}
      {bill.status === "UNPAID" && canOrder(state, session) && !!reason && (
        <Button
          title={
            sessionDrafts(state, session.id).length
              ? "Xử lý giỏ chưa gửi"
              : "Xem tiến độ và phục vụ món"
          }
          variant="secondary"
          onPress={() =>
            openServiceScreen(
              sessionDrafts(state, session.id).length ? "cart" : "progress",
              session,
            )
          }
        />
      )}
      {bill.status === "PAYMENT_REQUESTED" && (
        <>
          <Message kind="info">
            Đã gửi lúc {dateTimeLabel(bill.requestedAt!)}. Đang chờ thu ngân xử lý; bàn đã khóa gọi
            thêm món.
          </Message>
          <Button
            title="Rút yêu cầu thanh toán"
            variant="secondary"
            onPress={() => setWithdrawing(true)}
          />
        </>
      )}
      {bill.status === "PAID" && (
        <>
          <Message kind="success">
            Thu ngân đã xác nhận lúc {dateTimeLabel(bill.paidAt!)}.{" "}
            Thanh toán đủ tự đóng mọi phiên của hóa đơn; mỗi bàn chuyển sang chờ dọn.
          </Message>
          <Button
            title="Mở kết thúc phục vụ"
            onPress={() => openServiceScreen("finish", session)}
          />
        </>
      )}
      {confirm && (
        <ConfirmDialog
          title="Yêu cầu thanh toán"
          message={`Gửi tổng tạm tính cho bàn ${tableCode(state.tables, session.tableId)} đến thu ngân? Thao tác gọi thêm món sẽ bị khóa.`}
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            act({ type: "request-payment", sessionId: session.id });
          }}
        />
      )}
      {withdrawing && (
        <ConfirmDialog
          title="Rút yêu cầu thanh toán"
          message={`Rút lại yêu cầu thanh toán cho bàn ${tableCode(state.tables, session.tableId)}? Bàn sẽ mở lại để gọi thêm món.`}
          onCancel={() => setWithdrawing(false)}
          onConfirm={() => {
            setWithdrawing(false);
            act({ type: "withdraw-payment-request", sessionId: session.id });
          }}
        />
      )}
    </Screen>
  );
}
