import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Message,
  ui,
} from "@/components/ui";
import { TableItem } from "@/features/tables/components/table-item";
import { useApp } from "@/store/app-store";
import { dateTimeLabel } from "@/utils/dates";
import { canAssignTable, getReservationActions } from "../rules";
import { tableCode } from "@/features/tables/labels";
export default function AssignTableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, now, run } = useApp();
  const [selected, setSelected] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const r = state.reservations.find((item) => item.id === id);
  if (
    !r ||
    !getReservationActions(r, now, state.session!.role, state.settings.noShowMinutes).includes("assign")
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
    check: canAssignTable(state, r, table.id, now),
  }));
  const validSelected = selected && canAssignTable(state, r, selected, now).ok;
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
              Bàn hiện tại: {r.tableId ? tableCode(state.tables, r.tableId) : "Chưa gán"}. Không hỗ trợ ghép bàn.
            </Text>
            {!!error && <Message>{error}</Message>}
            {!checks.some((item) => item.check.ok) && (
              <Message>
                Chưa có bàn phù hợp. Các lý do được hiển thị bên dưới.
              </Message>
            )}
            <Button
              title={
                selected ? `Xác nhận bàn ${selected}` : "Chọn bàn bên dưới"
              }
              disabled={!validSelected}
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
            selected={selected === item.table.id}
            reason={item.check.ok ? undefined : item.check.reason}
            onPress={() => setSelected(item.table.id)}
          />
        )}
      />
      {confirm && (
        <ConfirmDialog
          title={r.tableId ? "Xác nhận đổi bàn" : "Xác nhận gán bàn"}
          message={`Bàn cũ: ${r.tableId ? tableCode(state.tables, r.tableId) : "Chưa có"} → bàn mới: ${tableCode(state.tables, selected)}. Kiểm tra lại xung đột trước khi lưu.`}
          onCancel={() => setConfirm(false)}
          onConfirm={async () => {
            try {
              await run({ type: "assign", id: r.id, tableId: selected });
              if (r.status === "ARRIVED")
                router.replace(`/reception/handover?id=${r.id}`);
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
