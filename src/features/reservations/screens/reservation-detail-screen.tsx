import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Share, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import {
  Button,
  ConfirmDialog,
  DetailRow,
  EmptyState,
  Message,
  Section,
  ui,
} from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors } from "@/theme";
import { dateTimeLabel } from "@/utils/dates";
import { StatusBadge } from "../components/status-badge";
import { SOURCE_LABELS } from "../labels";
import { getAvailableTables, getReservationActions } from "../rules";
import type { ReservationAction } from "../types";
const ACTION_LABELS: Record<ReservationAction, string> = {
  confirm: "Xác nhận",
  reject: "Từ chối",
  cancel: "Hủy lịch",
  edit: "Chỉnh sửa",
  assign: "Gán / đổi bàn",
  "check-in": "Nhận khách",
  handover: "Bàn giao cho phục vụ",
  "no-show": "Đánh dấu không đến",
};
export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, now, run, changeSession, busy } = useApp();
  const [dialog, setDialog] = useState<"confirm" | "reject" | "cancel" | "no-show" | null>(null);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [error, setError] = useState<{ text: string; at: "top" | "bottom" }>();
  const [origin, setOrigin] = useState<"top" | "bottom">("top");
  const r = state.reservations.find((item) => item.id === id);
  if (!r)
    return (
      <Screen>
        <EmptyState
          title="Không tìm thấy lịch đặt"
          description="Lịch này không còn tồn tại hoặc đã bị xóa."
        />
      </Screen>
    );
  const table = state.tables.find((t) => t.id === r.tableId);
  const area = state.areas.find((a) => a.id === table?.areaId);
  const actions = getReservationActions(r, now, state.session!.role, state.settings.noShowMinutes);
  const nextAction: ReservationAction | undefined =
    r.status === "PENDING"
      ? "confirm"
      : r.status === "CONFIRMED"
        ? "check-in"
        : r.status === "ARRIVED"
          ? table
            ? "handover"
            : "assign"
          : undefined;
  const awaitingDeposit = r.status === "PENDING" && !!r.deposit && !r.deposit.paidAt;
  const primaryAction =
    !awaitingDeposit && nextAction && actions.includes(nextAction) ? nextAction : undefined;
  // Confirming is blocked server-side until the deposit arrives, so don't offer it.
  const otherActions = actions.filter(
    (action) => action !== primaryAction && !(awaitingDeposit && action === "confirm"),
  );
  const canRequestException = ["PENDING", "CONFIRMED", "ARRIVED"].includes(r.status);
  const candidate = r.tableId ? table?.code : getAvailableTables(state, r, r.id, now)[0]?.code;
  const askRefund = dialog === "cancel" && !!r.deposit?.paidAt;
  const depositAmount = r.deposit ? `${r.deposit.amount.toLocaleString("vi-VN")}đ` : "";
  const preorderText = r.preorder
    ?.map((p) => {
      const dish = state.menuItems.find((m) => m.id === p.menuItemId);
      return `${dish?.name ?? "Món không còn bán"} × ${p.quantity}`;
    })
    .join(", ");
  function fail(e: unknown, at: "top" | "bottom" = origin) {
    setError({ text: (e as Error).message, at });
  }
  function act(action: ReservationAction, from: "top" | "bottom") {
    setError(undefined);
    setOrigin(from);
    if (action === "confirm" || action === "reject" || action === "cancel" || action === "no-show")
      setDialog(action);
    else if (action === "edit") router.push(`/reception/reservations/form?id=${id}`);
    else if (action === "assign") router.push(`/reception/reservations/assign?id=${id}`);
    else if (action === "check-in") router.push(`/reception/check-in?id=${id}`);
    else if (action === "handover") router.push(`/reception/handover?id=${id}`);
  }
  const topError = error?.at === "top" && <Message>{error.text}</Message>;
  const bottomError = error?.at === "bottom" && <Message>{error.text}</Message>;
  return (
    <Screen>
      <View style={ui.row}>
        <Text style={ui.title}>{r.code}</Text>
        <StatusBadge status={r.status} />
      </View>
      <View style={{ gap: 4 }}>
        <Text style={ui.heading}>{r.customer.name}</Text>
        <Text style={ui.muted}>
          {dateTimeLabel(r.startsAt)} · {r.actualGuests ?? r.guests} khách
        </Text>
        {r.customer.phone ? (
          <Text
            accessibilityRole="link"
            accessibilityLabel={`Gọi ${r.customer.phone}`}
            onPress={() => Linking.openURL(`tel:${r.customer.phone}`)}
            style={[ui.text, { color: colors.primary, fontWeight: "600" }]}
          >
            Gọi {r.customer.phone}
          </Text>
        ) : (
          <Text style={ui.muted}>Không có số điện thoại</Text>
        )}
      </View>
      {(r.deposit || !!preorderText) && (
        <View style={ui.panel}>
          {r.deposit && (
            <DetailRow
              label="Tiền cọc"
              value={
                r.deposit.paidAt
                  ? `${depositAmount} · đã nhận ${dateTimeLabel(r.deposit.paidAt)}`
                  : `${depositAmount} · chưa nhận`
              }
            />
          )}
          {!!preorderText && <DetailRow label="Món đặt trước" value={preorderText} />}
        </View>
      )}
      {awaitingDeposit && (
        <Message kind="info">
          Thu cọc trước {dateTimeLabel(r.deposit!.dueAt)}. Không hoàn cọc khi hủy hoặc không đến. Lễ
          tân không nhận tiền mặt; chuyển khách đến thu ngân. Trạng thái tự cập nhật sau khi máy chủ
          nhận thanh toán.
        </Message>
      )}
      {r.status === "PENDING" && !awaitingDeposit && (
        <Message kind="info">
          Lịch chưa được giữ bàn. Khi xác nhận, hệ thống sẽ tự giữ một bàn phù hợp.
        </Message>
      )}
      {r.status === "CONFIRMED" && (
        <Text style={ui.muted}>
          Nếu khách trễ quá {state.settings.noShowMinutes} phút, lịch sẽ tự chuyển sang “Không đến”.
        </Text>
      )}
      {topError}
      {awaitingDeposit && actions.length > 0 && (
        <Section title="Thu cọc">
          {r.deposit?.cashRequestedAt && (
            <Message kind="info">Đã chuyển thu ngân thu cọc tiền mặt.</Message>
          )}
          <Button
            title="Tạo link thu cọc payOS"
            disabled={busy}
            onPress={async () => {
              try {
                await run({ type: "deposit-link", id: r.id });
              } catch (e) {
                fail(e, "top");
              }
            }}
          />
          {!!r.deposit?.payos?.checkoutUrl && (
            <>
              <Text selectable style={ui.text}>
                {r.deposit.payos.checkoutUrl}
              </Text>
              <Button
                title="Gửi link cho khách (Zalo / SMS)"
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `Thanh toán cọc đặt bàn ${r.code}: ${r.deposit!.payos!.checkoutUrl}`,
                    });
                  } catch (e) {
                    fail(e, "top");
                  }
                }}
              />
              <Text style={ui.muted}>Hoặc nhấn giữ liên kết để sao chép.</Text>
              <Button
                title="Mở thanh toán payOS / QR"
                variant="secondary"
                onPress={async () => {
                  try {
                    await Linking.openURL(r.deposit!.payos!.checkoutUrl);
                  } catch (e) {
                    fail(e, "top");
                  }
                }}
              />
              <Button
                title="Kiểm tra lại"
                disabled={busy}
                variant="secondary"
                onPress={async () => {
                  try {
                    await changeSession({
                      type: "refresh-payment",
                      paymentId: r.deposit!.payos!.paymentId,
                    });
                  } catch (e) {
                    fail(e, "top");
                  }
                }}
              />
            </>
          )}
          <Button
            title="Chuyển thu ngân thu cọc tiền mặt"
            disabled={busy}
            variant="secondary"
            onPress={() => setDepositOpen(true)}
          />
        </Section>
      )}
      {primaryAction && (
        <Button title={ACTION_LABELS[primaryAction]} onPress={() => act(primaryAction, "top")} />
      )}
      <View style={ui.panel}>
        <DetailRow
          label="Khách dự kiến / thực tế"
          value={`${r.guests} / ${r.actualGuests ?? "Chưa đến"}`}
        />
        <DetailRow label="Thời lượng dự kiến" value={`${r.duration} phút`} />
        <DetailRow
          label="Bàn / khu vực"
          value={table ? `${table.code} · ${area?.name}` : "Chưa gán bàn"}
        />
        {table && (
          <Button
            title={`Xem trạng thái bàn ${table.code}`}
            variant="secondary"
            onPress={() => router.push(`/reception/tables/${table.id}`)}
          />
        )}
        <DetailRow
          label="Khu vực mong muốn"
          value={state.areas.find((a) => a.id === r.areaId)?.name ?? "Không yêu cầu"}
        />
        {r.email && <DetailRow label="Email" value={r.email} />}
        {r.occasion && <DetailRow label="Dịp đặc biệt" value={r.occasion} />}
        <DetailRow label="Nguồn đặt bàn" value={SOURCE_LABELS[r.source]} />
        <DetailRow label="Ghi chú" value={r.notes || "Không có"} />
        <DetailRow label="Yêu cầu đặc biệt" value={r.specialRequests || "Không có"} />
        {r.arrivedAt && <DetailRow label="Khách đến lúc" value={dateTimeLabel(r.arrivedAt)} />}
        {r.handedOverAt && <DetailRow label="Bàn giao lúc" value={dateTimeLabel(r.handedOverAt)} />}
        {r.reason && <DetailRow label="Lý do" value={r.reason} />}
      </View>
      {depositOpen && r.deposit && (
        <ConfirmDialog
          title="Chuyển thu ngân thu cọc"
          message={`Chuyển yêu cầu thu ${depositAmount} cho thu ngân? Link payOS hiện tại sẽ bị hủy để tránh thu hai lần.`}
          onCancel={() => setDepositOpen(false)}
          onConfirm={async () => {
            try {
              await run({ type: "deposit-cash", id: r.id });
            } catch (e) {
              fail(e, "top");
            }
            setDepositOpen(false);
          }}
        />
      )}
      {!actions.length && (
        <Message kind="info">
          Lịch này chỉ để xem. Thanh toán và dọn bàn do phục vụ và thu ngân xử lý.
        </Message>
      )}
      {(!!otherActions.length || canRequestException) && (
        <Section title="Thao tác khác">
          {bottomError}
          {otherActions.map((action) => (
            <Button
              key={action}
              title={ACTION_LABELS[action]}
              variant={["reject", "cancel", "no-show"].includes(action) ? "danger" : "secondary"}
              onPress={() => act(action, "bottom")}
            />
          ))}
          {canRequestException && (
            <Button
              title="Nhờ quản lý duyệt"
              variant="secondary"
              onPress={() => {
                setError(undefined);
                setOrigin("bottom");
                setExceptionOpen(true);
              }}
            />
          )}
        </Section>
      )}
      <Section title="Lịch sử">
        {r.history
          .slice()
          .reverse()
          .map((event, index) => (
            <View key={`${event.at}-${index}`} style={ui.panel}>
              <Text style={ui.text}>{event.text}</Text>
              <Text style={ui.muted}>{dateTimeLabel(event.at)}</Text>
            </View>
          ))}
      </Section>
      {exceptionOpen && (
        <ConfirmDialog
          title="Nhờ quản lý duyệt"
          requireReason
          message={`Gửi lịch ${r.code} cho quản lý xem xét (ví dụ: khách đông hơn sức chứa, đổi giờ sát giờ). Ghi rõ lý do bên dưới.`}
          onCancel={() => setExceptionOpen(false)}
          onConfirm={async (reason) => {
            try {
              await run({ type: "request-exception", id: r.id, reason: reason ?? "" });
            } catch (e) {
              fail(e);
            }
            setExceptionOpen(false);
          }}
        />
      )}
      {dialog && (
        <ConfirmDialog
          key={dialog}
          title={ACTION_LABELS[dialog]}
          requireReason={dialog !== "confirm"}
          message={
            dialog === "confirm"
              ? `Xác nhận ${r.code} và giữ bàn ${candidate ?? "phù hợp"}?`
              : `${ACTION_LABELS[dialog]} ${r.code}? Bàn đang giữ cho lịch này sẽ được trả lại.`
          }
          onCancel={() => setDialog(null)}
          onConfirm={async (reason) => {
            try {
              await run({
                type: dialog,
                id: r.id,
                reason,
              });
              setDialog(null);
            } catch (e) {
              fail(e);
              setDialog(null);
            }
          }}
        >
          {askRefund && (
            <View style={{ gap: 8 }}>
              <Text style={ui.label}>Tiền cọc {depositAmount} *</Text>
              <Text style={ui.text}>Không hoàn cọc trong mọi trường hợp.</Text>
            </View>
          )}
        </ConfirmDialog>
      )}
    </Screen>
  );
}
