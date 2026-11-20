import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import {
  Button,
  EmptyState,
  Field,
  Message,
  SearchInput,
  ui,
} from "@/components/ui";
import { useApp } from "@/store/app-store";
import { dateTimeLabel } from "@/utils/dates";
import { ReservationListItem } from "../components/reservation-list-item";
  canCheckIn,
  getAvailableTables,
  isTableAvailableForTimeRange,
  matchesReservation,
} from "../rules";
import type { Reservation } from "../types";
export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const r = state.reservations.find((item) => item.id === id);
  if (id)
    return r ? (
      <CheckInForm key={r.id} reservation={r} />
    ) : (
      <Screen>
        <EmptyState title="Không tìm thấy lịch đặt" />
      </Screen>
    );
  const results = state.reservations
    .filter((r) => r.status === "CONFIRMED" && matchesReservation(r, query))
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  return (
    <Screen scroll={false}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ marginBottom: 12, gap: 10 }}>
            <SearchInput value={query} onChangeText={setQuery} />
            <Text style={ui.muted}>
              Chỉ hiển thị lịch đã xác nhận. Tìm theo tên, số điện thoại hoặc mã đặt bàn.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View>
            <Text style={ui.muted}>{dateTimeLabel(item.startsAt)}</Text>
            <ReservationListItem
              reservation={item}
              onPress={() => router.push(`/reception/check-in?id=${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Không có lịch đã xác nhận phù hợp"
            description="Kiểm tra lại từ khóa tìm kiếm, hoặc xác nhận lịch trước khi nhận khách."
          />
        }
      />
    </Screen>
  );
}
function CheckInForm({ reservation: r }: { reservation: Reservation }) {
  const { state, now, run } = useApp();
  const [actual, setActual] = useState(String(r.guests));
  const [error, setError] = useState("");
  const check = canCheckIn(r, now, state.settings.earlyCheckInMinutes);
  const table = state.tables.find((t) => t.id === r.tableId);
  const actualCount = Number(actual);
  const badCount = !Number.isInteger(actualCount) || actualCount < 1 || actualCount > 200;
  const tooMany = table && actualCount > table.capacity;
  const availability = table
    ? isTableAvailableForTimeRange(
        state,
        table,
        {
          ...r,
          startsAt: now.toISOString(),
          guests: Number(actual),
        },
        r.id,
        now,
      )
    : undefined;
  const needsTable =
    !table || !availability?.ok || table.status !== "AVAILABLE";
  // Without a fitting free table now, the party can only be seated by splitting it or asking the manager.
  const noFittingTable = !badCount && needsTable && !getAvailableTables(state, { ...r, startsAt: now.toISOString(), guests: actualCount }, r.id, now)
    .some((t) => t.status === "AVAILABLE");
  return (
    <Screen>
      <Text style={ui.heading}>
        {r.customer.name} · {r.code}
      </Text>
      <Text style={ui.text}>
        Hẹn {dateTimeLabel(r.startsAt)} · {r.guests} khách dự kiến
      </Text>
      <Text style={ui.text}>
        Bàn {table ? `${table.code} · ${table.capacity} chỗ` : "chưa gán"}
      </Text>
      {!check.ok && <Message>{check.reason}</Message>}
      <Field
        label="Số khách thực tế *"
        keyboardType="number-pad"
        value={actual}
        onChangeText={setActual}
        editable={check.ok}
        error={badCount ? "Số khách thực tế từ 1 đến 200." : undefined}
      />
      {tooMany && (
        <Message>
          Số khách vượt sức chứa bàn {table.code}. Có thể ghi nhận khách đã đến,
          nhưng cần đổi bàn phù hợp trước khi bàn giao.
        </Message>
      )}
      {!table && (
        <Message kind="info">
          Lịch chưa có bàn. Hãy chọn bàn trước khi bàn giao cho phục vụ.
        </Message>
      )}
      {!tooMany && availability && !availability.ok && (
        <Message>
          {availability.reason} Có thể ghi nhận khách đã đến, sau đó chọn bàn
          khác trước khi bàn giao.
        </Message>
      )}
      {noFittingTable && (
        <Message>
          Hiện không còn bàn trống nào đủ chỗ cho {actualCount} khách trong khu này. Hãy chờ bàn trống,
          đổi khu hoặc nhờ quản lý duyệt ở màn chi tiết lịch đặt.
        </Message>
      )}
      {!!error && <Message>{error}</Message>}
      <Message kind="info">
        Bước này chỉ ghi nhận khách đã đến. Bàn chuyển sang “đang sử dụng” khi bàn giao cho phục vụ.
      </Message>
      <Button
        title="Xác nhận khách đã đến"
        disabled={!check.ok || badCount}
        onPress={async () => {
          try {
            await run({ type: "check-in", id: r.id, actualGuests: Number(actual) });
            router.replace(
              needsTable
                ? `/reception/reservations/assign?id=${r.id}`
                : `/reception/handover?id=${r.id}`,
            );
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
      <Button
        title="Xem chi tiết đặt bàn"
        variant="secondary"
        onPress={() => router.replace(`/reception/reservations/${r.id}`)}
      />
    </Screen>
  );
}
