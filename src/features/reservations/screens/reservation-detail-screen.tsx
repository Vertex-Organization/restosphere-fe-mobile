import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
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
import { dateTimeLabel } from "@/utils/dates";
import { StatusBadge } from "../components/status-badge";
import { SOURCE_LABELS } from "../labels";
import {
  canConfirmReservation,
  getAvailableTables,
  getReservationActions,
} from "../rules";
import type { ReservationAction } from "../types";
const ACTION_LABELS: Record<ReservationAction, string> = {
  confirm: "Xác nhận",
  reject: "Từ chối",
  cancel: "Hủy lịch",
  edit: "Chỉnh sửa",
  assign: "Gán / đổi bàn",
  "check-in": "Check-in",
  handover: "Bàn giao cho phục vụ",
  "no-show": "Đánh dấu không đến",
};
export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, now, run } = useApp();
  const [dialog, setDialog] = useState<
    "confirm" | "reject" | "cancel" | "no-show" | null
  >(null);
  const [error, setError] = useState("");
  const r = state.reservations.find((item) => item.id === id);
  if (!r)
    return (
      <Screen>
        <EmptyState
          title="Không tìm thấy lịch đặt"
          description="Lịch này không còn trong dữ liệu demo hiện tại."
        />
      </Screen>
    );
  const table = state.tables.find((t) => t.id === r.tableId);
  const area = state.areas.find((a) => a.id === table?.areaId);
  const actions = getReservationActions(r, now, state.session!.role);
  const candidate = r.tableId ?? getAvailableTables(state, r, r.id, now)[0]?.id;
  function act(action: ReservationAction) {
    setError("");
    if (action === "confirm") {
      const check = canConfirmReservation(state, r!, new Date());
      if (!check.ok) return setError(check.reason);
    }
    if (
      action === "confirm" ||
      action === "reject" ||
      action === "cancel" ||
      action === "no-show"
    )
      setDialog(action);
    else if (action === "edit") router.push(`/reception/reservations/form?id=${id}`);
    else if (action === "assign") router.push(`/reception/reservations/assign?id=${id}`);
    else if (action === "check-in") router.push(`/reception/check-in?id=${id}`);
    else if (action === "handover") router.push(`/reception/handover?id=${id}`);
  }
  return (
    <Screen>
      <View style={ui.row}>
        <Text style={ui.title}>{r.code}</Text>
        <StatusBadge status={r.status} />
      </View>
      {!!error && <Message>{error}</Message>}
      <View style={ui.panel}>
        <DetailRow label="Khách hàng" value={r.customer.name} />
        <DetailRow
          label="Số điện thoại"
          value={r.customer.phone || "Không cung cấp"}
        />
        <DetailRow label="Ngày giờ hẹn" value={dateTimeLabel(r.startsAt)} />
        <DetailRow
          label="Khách dự kiến / thực tế"
          value={`${r.guests} / ${r.actualGuests ?? "Chưa đến"}`}
        />
        <DetailRow
          label="Thời lượng dự kiến"
          value={`${r.duration} phút + 15 phút đệm`}
        />
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
          value={
            state.areas.find((a) => a.id === r.areaId)?.name ?? "Không yêu cầu"
          }
        />
        <DetailRow label="Nguồn đặt bàn" value={SOURCE_LABELS[r.source]} />
        <DetailRow label="Ghi chú" value={r.notes || "Không có"} />
        <DetailRow
          label="Yêu cầu đặc biệt"
          value={r.specialRequests || "Không có"}
        />
        {r.arrivedAt && (
          <DetailRow label="Check-in lúc" value={dateTimeLabel(r.arrivedAt)} />
        )}
        {r.handedOverAt && (
          <DetailRow
            label="Bàn giao lúc"
            value={dateTimeLabel(r.handedOverAt)}
          />
        )}
        {r.reason && <DetailRow label="Lý do" value={r.reason} />}
      </View>
      {r.status === "PENDING" && (
        <Message kind="info">
          Xác nhận sẽ kiểm tra khả năng tiếp nhận và giữ một bàn phù hợp. Lịch
          đang chờ chưa giữ chỗ.
        </Message>
      )}
      {r.status === "CONFIRMED" && (
        <Text style={ui.muted}>
          Chỉ đánh dấu không đến sau 30 phút chờ. Không tự động chuyển trạng
          thái.
        </Text>
      )}
      {!actions.length && (
        <Message kind="info">
          Lịch chỉ được xem ở trạng thái này. Lễ tân không thực hiện thanh toán,
          checkout hoặc dọn bàn.
        </Message>
      )}
      <View style={{ gap: 10 }}>
        {actions.map((action) => (
          <Button
            key={action}
            title={ACTION_LABELS[action]}
            variant={
              ["reject", "cancel", "no-show"].includes(action)
                ? "danger"
                : ["edit", "assign"].includes(action)
                  ? "secondary"
                  : "primary"
            }
            onPress={() => act(action)}
          />
        ))}
      </View>
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
      {dialog && (
        <ConfirmDialog
          key={dialog}
          title={ACTION_LABELS[dialog]}
          requireReason={dialog !== "confirm"}
          message={
            dialog === "confirm"
              ? `Xác nhận ${r.code} và giữ bàn ${candidate ?? "phù hợp"}?`
              : `${ACTION_LABELS[dialog]} ${r.code}? Phần giữ bàn sẽ được giải phóng.`
          }
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => {
            try {
              run({ type: dialog, id: r.id, reason });
              setDialog(null);
            } catch (e) {
              setError((e as Error).message);
              setDialog(null);
            }
          }}
        />
      )}
    </Screen>
  );
}
