import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Screen } from "@/components/layout/screen";
import { Button, EmptyState, Field, Message, SearchInput, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { dateTimeLabel } from "@/utils/dates";
import { ReservationListItem } from "../components/reservation-list-item";
import { errorField } from "@/features/auth/api";
import { canHandover, matchesReservation } from "../rules";
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
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
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
  const [field, setField] = useState("");
  const table = state.tables.find((t) => t.id === r.tableId);
  const actualCount = Number(actual);
  const badCount = !Number.isInteger(actualCount) || actualCount < 1;
  const availability = canHandover(state, { ...r, status: "ARRIVED", actualGuests: actualCount }, now);
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
      <Field
        label="Số khách thực tế *"
        keyboardType="number-pad"
        value={actual}
        onChangeText={setActual}
        error={field === "actualGuests" ? error : undefined}
      />
      {!availability.ok && <Message>{availability.reason} Hãy xếp bàn phù hợp trước khi check-in.</Message>}
      {!!error && field !== "actualGuests" && <Message>{error}</Message>}
      <Message kind="info">
        Check-in mở phiên phục vụ cho mọi bàn đã xếp, dùng chung một hóa đơn và chuyển bàn sang đang sử dụng.
      </Message>
      <Button
        title="Xác nhận khách đã đến"
        disabled={badCount || !availability.ok}
        onPress={async () => {
          setError("");
          setField("");
          try {
            await run({ type: "check-in", id: r.id, actualGuests: Number(actual) });
            router.replace(`/reception/reservations/${r.id}`);
          } catch (e) {
            setError((e as Error).message);
            setField(errorField(e) ?? "");
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
