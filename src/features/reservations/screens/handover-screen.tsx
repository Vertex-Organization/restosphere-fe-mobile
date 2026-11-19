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
  ui,
} from "@/components/ui";
import { useApp } from "@/store/app-store";
import { dateTimeLabel } from "@/utils/dates";
import { canHandover } from "../rules";
export default function HandoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, now, run } = useApp();
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const r = state.reservations.find((item) => item.id === id);
  if (!r)
    return (
      <Screen>
        <EmptyState title="Không tìm thấy lịch đặt" />
      </Screen>
    );
  const table = state.tables.find((t) => t.id === r.tableId);
  const check = canHandover(state, r, now);
  return (
    <Screen>
      <Text style={ui.heading}>
        {r.customer.name} · {r.code}
      </Text>
      <View style={ui.panel}>
        <DetailRow label="Số khách thực tế" value={r.actualGuests} />
        <DetailRow label="Bàn" value={table?.code} />
        <DetailRow
          label="Khu vực"
          value={state.areas.find((a) => a.id === table?.areaId)?.name}
        />
        <DetailRow
          label="Đến lúc"
          value={r.arrivedAt ? dateTimeLabel(r.arrivedAt) : "Chưa đến"}
        />
        <DetailRow label="Ghi chú" value={r.notes || "Không có"} />
        <DetailRow
          label="Yêu cầu đặc biệt"
          value={r.specialRequests || "Không có"}
        />
      </View>
      {!check.ok && <Message>{check.reason}</Message>}
      {!!error && <Message>{error}</Message>}
      <Button
        title="Xác nhận bàn giao"
        disabled={!check.ok}
        onPress={() => setConfirm(true)}
      />
      {r.status === "ARRIVED" && (
        <Button
          title="Gán / đổi bàn"
          variant="secondary"
          onPress={() => router.push(`/reception/reservations/assign?id=${r.id}`)}
        />
      )}
      <Button
        title="Chi tiết đặt bàn"
        variant="secondary"
        onPress={() => router.replace(`/reception/reservations/${r.id}`)}
      />
      {confirm && (
        <ConfirmDialog
          title="Bàn giao cho phục vụ"
          message={`${r.actualGuests} khách vào bàn ${table?.code ?? "—"}. Sau khi bàn giao, phục vụ sẽ tiếp nhận bàn này.`}
          onCancel={() => setConfirm(false)}
          onConfirm={async () => {
            try {
              await run({ type: "handover", id: r.id });
              router.replace(`/reception/reservations/${r.id}`);
            } catch (e) {
              setError((e as Error).message);
            }
            setConfirm(false);
          }}
        />
      )}
    </Screen>
  );
}
