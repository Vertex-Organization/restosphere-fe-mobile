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
  "check-in": "Nhận khách",
  handover: "Bàn giao cho phục vụ",
  "no-show": "Đánh dấu không đến",
};
export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, now, run } = useApp();
  const [dialog, setDialog] = useState<
    "confirm" | "reject" | "cancel" | "no-show" | null
  >(null);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [error, setError] = useState("");
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
  const nextAction: ReservationAction | undefined = r.status === "PENDING" ? "confirm"
    : r.status === "CONFIRMED" ? "check-in"
    : r.status === "ARRIVED" ? (table ? "handover" : "assign") : undefined;
  const primaryAction = nextAction && actions.includes(nextAction) ? nextAction : undefined;
  const otherActions = actions.filter((action) => action !== primaryAction);
  const candidate = r.tableId ? table?.code : getAvailableTables(state, r, r.id, now)[0]?.code;
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
      <View style={{ gap: 4 }}>
        <Text style={ui.heading}>{r.customer.name}</Text>
        <Text style={ui.muted}>{dateTimeLabel(r.startsAt)} · {r.actualGuests ?? r.guests} khách</Text>
      </View>
      {!!error && <Message>{error}</Message>}
      {primaryAction && <Button title={ACTION_LABELS[primaryAction]} onPress={() => act(primaryAction)} />}
      <View style={ui.panel}>
        <DetailRow
          label="Số điện thoại"
          value={r.customer.phone || "Không cung cấp"}
        />
        <DetailRow
          label="Khách dự kiến / thực tế"
          value={`${r.guests} / ${r.actualGuests ?? "Chưa đến"}`}
        />
        <DetailRow
          label="Thời lượng dự kiến"
          value={`${r.duration} phút`}
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
        {r.email && <DetailRow label="Email" value={r.email} />}
        {r.occasion && <DetailRow label="Dịp đặc biệt" value={r.occasion} />}
        {!!r.preorder?.length && (
          <DetailRow
            label="Món đặt trước"
            value={r.preorder
              .map((p) => {
                const dish = state.menuItems.find((m) => m.id === p.menuItemId);
                return `${dish?.name ?? "Món không còn bán"} × ${p.quantity}`;
              })
              .join(", ")}
          />
        )}
        <DetailRow label="Nguồn đặt bàn" value={SOURCE_LABELS[r.source]} />
        <DetailRow label="Ghi chú" value={r.notes || "Không có"} />
        <DetailRow
          label="Yêu cầu đặc biệt"
          value={r.specialRequests || "Không có"}
        />
        {r.arrivedAt && (
          <DetailRow label="Khách đến lúc" value={dateTimeLabel(r.arrivedAt)} />
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
          Lịch chưa được giữ bàn. Khi xác nhận, hệ thống sẽ tự giữ một bàn phù hợp.
        </Message>
      )}
      {r.status === "CONFIRMED" && (
        <Text style={ui.muted}>
          Nếu khách trễ quá {state.settings.noShowMinutes} phút, lịch sẽ tự chuyển sang “Không đến”.
        </Text>
      )}
      {!actions.length && (
        <Message kind="info">
          Lịch này chỉ để xem. Thanh toán và dọn bàn do phục vụ và thu ngân xử lý.
        </Message>
      )}
      {!!otherActions.length && <Section title="Thao tác khác">
        {otherActions.map((action) => (
          <Button
            key={action}
            title={ACTION_LABELS[action]}
            variant={
              ["reject", "cancel", "no-show"].includes(action)
                ? "danger"
                : "secondary"
            }
            onPress={() => act(action)}
          />
        ))}
      </Section>}
      {["PENDING", "CONFIRMED", "ARRIVED"].includes(r.status) && (
        <Button title="Nhờ quản lý duyệt" variant="secondary" onPress={() => setExceptionOpen(true)} />
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
              setError((e as Error).message);
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
              await run({ type: dialog, id: r.id, reason });
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
