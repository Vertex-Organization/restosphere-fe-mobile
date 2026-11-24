import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Button, ConfirmDialog, EmptyState, Message, ui } from "@/components/ui";
import { TableItem } from "@/features/tables/components/table-item";
import { tableCode } from "@/features/tables/labels";
import { useApp } from "@/store/app-store";
import { dateTimeLabel } from "@/utils/dates";
import {
  canAssignTable,
  canAssignTables,
  getReservationActions,
  reservationTableIds,
} from "../rules";
export default function AssignTableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, now, run } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const r = state.reservations.find((item) => item.id === id);
  if (
    !r ||
    !getReservationActions(r, now, state.session!.role, state.settings.noShowMinutes).includes(
      "assign",
    )
  )
    return (
      <Screen>
        <EmptyState
          title="Không thể gán bàn"
          description="Chỉ gán / đổi bàn trước khi bàn giao, cho lịch đã xác nhận hoặc khách đã đến."
        />
      </Screen>
    );
  const checks = state.tables.map((table) => ({
    table,
    check: canAssignTable(state, { ...r, guests: 1, actualGuests: 1 }, table.id, now),
  }));

  return (
    <Screen scroll={false}>
      <FlatList
        data={checks}
        keyExtractor={(item) => item.table.id}
        contentContainerStyle={ui.content}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 14 }}>
            <Text style={ui.heading}>
              {r.customer.name} · {r.actualGuests ?? r.guests} khách
            </Text>
            <Text style={ui.text}>
              {dateTimeLabel(r.arrivedAt ?? r.startsAt)} · {r.duration} phút
            </Text>
            <Text style={ui.muted}>
              Bàn hiện tại:{" "}
              {reservationTableIds(r)
                .map((id) => tableCode(state.tables, id))
                .join(" + ") || "Chưa gán"}
              . Chọn nhiều bàn đủ tổng sức chứa.
            </Text>
            {!!error && <Message>{error}</Message>}
            {!checks.some((item) => item.check.ok) && (
              <Message>Chưa có bàn phù hợp. Các lý do được hiển thị bên dưới.</Message>
            )}
            <Button
              title={selected.length ? `Xác nhận ${selected.length} bàn` : "Chọn bàn bên dưới"}
              disabled={!canAssignTables(state, r, selected, now).ok}
              onPress={() => setConfirm(true)}
            />
            <Button
              title="Hủy thao tác"
              variant="secondary"
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace(`/reception/reservations/${r.id}`)
              }
            />
          </View>
        }
        renderItem={({ item }) => (
          <TableItem
            table={item.table}
            selected={selected.includes(item.table.id)}
            reason={item.check.ok ? undefined : item.check.reason}
            onPress={() =>
              setSelected(
                selected.includes(item.table.id)
                  ? selected.filter((id) => id !== item.table.id)
                  : [...selected, item.table.id],
              )
            }
          />
        )}
      />
      {confirm && (
        <ConfirmDialog
          title={r.tableId ? "Xác nhận đổi bàn" : "Xác nhận gán bàn"}
          message={`Bàn cũ: ${r.tableId ? tableCode(state.tables, r.tableId) : "Chưa có"} → bàn mới: ${selected.map((id) => tableCode(state.tables, id)).join(" + ")}. Kiểm tra lại xung đột trước khi lưu.`}
          onCancel={() => setConfirm(false)}
          onConfirm={async () => {
            try {
              await run({ type: "assign", id: r.id, tableIds: selected });
              if (r.status === "ARRIVED") router.replace(`/reception/handover?id=${r.id}`);
              else if (router.canGoBack()) router.back();
              else router.replace(`/reception/reservations/${r.id}`);
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
