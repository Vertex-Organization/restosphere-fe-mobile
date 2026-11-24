import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Screen } from "@/components/layout/screen";
import {
  Button,
  ConfirmDialog,
  DateField,
  EmptyState,
  Field,
  Message,
  Section,
  Select,
  ui,
} from "@/components/ui";
import { errorField } from "@/features/auth/api";
import { TableItem } from "@/features/tables/components/table-item";
import { useApp } from "@/store/app-store";
import { addMinutes } from "@/utils/dates";
import {
  getAvailableTables,
  getReservationActions,
  isTableAvailableForTimeRange,
  reservationTableIds,
} from "../rules";
import type { Reservation, ReservationInput } from "../types";

// Server field names shown beside their own input instead of the top banner.
const FIELDS = [
  "name",
  "phone",
  "guests",
  "startsAt",
  "duration",
  "areaId",
  "notes",
  "specialRequests",
  "tableId",
];

export default function ReservationFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, now } = useApp();
  const r = state.reservations.find((item) => item.id === id);
  if (
    id &&
    (!r ||
      !getReservationActions(r, now, state.session!.role, state.settings.noShowMinutes).includes(
        "edit",
      ))
  )
    return (
      <Screen>
        <EmptyState
          title="Không thể chỉnh sửa lịch này"
          description="Chỉ sửa lịch đang chờ hoặc đã xác nhận, trước khi khách đến."
        />
      </Screen>
    );
  return <ReservationForm key={id ?? "new"} reservation={r} />;
}
export function WalkInScreen() {
  return <ReservationForm walkIn />;
}

function ReservationForm({
  reservation: r,
  walkIn = false,
}: {
  reservation?: Reservation;
  walkIn?: boolean;
}) {
  const { state, now, run } = useApp();
  const [counter, setCounter] = useState(false);
  const [name, setName] = useState(r?.customer.name ?? "");
  const [phone, setPhone] = useState(r?.customer.phone ?? "");
  const [date, setDate] = useState(r ? new Date(r.startsAt) : addMinutes(now, 60));
  const [guests, setGuests] = useState(String(r?.guests ?? 2));
  const [duration, setDuration] = useState(String(r?.duration ?? 90));
  const [areaId, setArea] = useState(r?.areaId ?? "");
  const [tableIds, setTables] = useState<string[]>(r ? reservationTableIds(r) : []);
  const [notes, setNotes] = useState(r?.notes ?? "");
  const [specialRequests, setSpecial] = useState(r?.specialRequests ?? "");
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  const fieldError = (...keys: string[]) => (keys.includes(field) ? error : undefined);
  const [discard, setDiscard] = useState(false);
  const input: ReservationInput = {
    customer: { name, phone },
    counter,
    startsAt: (walkIn ? now : date).toISOString(),
    guests: Number(guests),
    duration: Number(duration),
    areaId: areaId || undefined,
    tableIds,
    notes,
    specialRequests,
    email: r?.email,
    occasion: r?.occasion,
    preorder: r?.preorder,
  };
  const available = getAvailableTables(state, { ...input, guests: 1 }, r?.id, now).filter(
    (t) => !walkIn || t.status === "AVAILABLE",
  );
  async function save() {
    const actualInput = {
      ...input,
      startsAt: walkIn ? new Date().toISOString() : input.startsAt,
    };
    setError("");
    setField("");
    try {
      const id = r
        ? (await run({ type: "edit", id: r.id, input: actualInput }), r.id)
        : await run({ type: "create", input: actualInput, walkIn });
      if (id) router.replace(`/reception/reservations/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setField(errorField(e) ?? "");
    }
  }
  const generalError = error && !FIELDS.includes(field) ? error : "";
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: walkIn ? "Khách trực tiếp" : r ? `Sửa ${r.code}` : "Tạo đặt bàn",
        }}
      />
      <Text style={ui.heading}>
        {walkIn
          ? "Tiếp nhận ngay tại nhà hàng"
          : r
            ? "Cập nhật thông tin lịch đặt"
            : "Đặt bàn qua điện thoại"}
      </Text>
      <Text style={ui.muted}>
        {walkIn
          ? "Chọn bàn sẵn sàng. Khách được ghi nhận đã đến, sau đó bàn giao cho phục vụ."
          : "Lịch mới ở trạng thái chờ xác nhận và chưa giữ bàn."}
      </Text>
      {!walkIn && !r && (
        <Select
          label="Nguồn đặt bàn"
          value={counter ? "counter" : "phone"}
          onChange={(value) => setCounter(value === "counter")}
          options={[
            { value: "phone", label: "Qua điện thoại" },
            { value: "counter", label: "Tại quầy · đặt cho lần đến sau" },
          ]}
        />
      )}
      {!!generalError && <Message>{generalError}</Message>}
      <Section title="Thông tin khách">
        <Field
          label="Tên khách *"
          value={name}
          onChangeText={setName}
          error={fieldError("name")}
          autoCapitalize="words"
        />
        <Field
          label="Số điện thoại *"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={fieldError("phone")}
        />
        <Field
          label="Số khách *"
          value={guests}
          onChangeText={setGuests}
          keyboardType="number-pad"
          error={fieldError("guests")}
        />
      </Section>
      {!walkIn && (
        <Section title="Thời gian">
          <DateField label="Ngày đặt *" value={date} onChange={setDate} />
          <DateField label="Giờ đến *" mode="time" value={date} onChange={setDate} />
        </Section>
      )}
      {!!fieldError("startsAt") && <Message>{fieldError("startsAt")}</Message>}
      <Field
        label="Thời lượng dự kiến (phút) *"
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        error={fieldError("duration")}
      />
      <Select
        label="Khu vực mong muốn"
        value={areaId}
        onChange={(value) => {
          setArea(value);
          setTables([]);
        }}
        options={[
          { value: "", label: "Không yêu cầu khu" },
          ...state.areas
            .filter((a) => a.active !== false)
            .map((a) => ({ value: a.id, label: a.name })),
        ]}
      />
      {!!fieldError("areaId") && <Message>{fieldError("areaId")}</Message>}
      <Field
        label="Ghi chú"
        value={notes}
        onChangeText={setNotes}
        multiline
        error={fieldError("notes")}
      />
      <Field
        label="Yêu cầu đặc biệt"
        value={specialRequests}
        onChangeText={setSpecial}
        multiline
        error={fieldError("specialRequests")}
      />
      <Section title="Chọn bàn · có thể chọn nhiều bàn">
        {!available.length && (
          <Message>
            Không có bàn sẵn sàng đủ sức chứa và không trùng lịch. Chưa thể tiếp nhận khách.
          </Message>
        )}
        {state.tables
          .filter((t) => !areaId || t.areaId === areaId)
          .map((t) => {
            const check = isTableAvailableForTimeRange(
              state,
              t,
              { ...input, guests: 1 },
              r?.id,
              now,
            );
            return (
              <TableItem
                key={t.id}
                table={t}
                selected={tableIds.includes(t.id)}
                reason={
                  !check.ok
                    ? check.reason
                    : walkIn && t.status !== "AVAILABLE"
                      ? "Bàn chưa sẵn sàng để tiếp nhận ngay."
                      : undefined
                }
                onPress={() =>
                  setTables(
                    tableIds.includes(t.id)
                      ? tableIds.filter((id) => id !== t.id)
                      : [...tableIds, t.id],
                  )
                }
              />
            );
          })}
      </Section>
      {!!fieldError("tableId") && <Message>{fieldError("tableId")}</Message>}
      {!available.length && !walkIn && (
        <Message>
          Không có bàn phù hợp khung giờ và số khách hiện tại. Hãy điều chỉnh thông tin trước khi
          lưu.
        </Message>
      )}
      <Button title={walkIn ? "Xác nhận khách đã đến · Tiếp tục" : "Lưu đặt bàn"} onPress={save} />
      <Button title="Hủy thao tác" variant="secondary" onPress={() => setDiscard(true)} />
      {discard && (
        <ConfirmDialog
          title="Hủy thao tác"
          message="Bỏ nội dung chưa lưu và quay lại?"
          onCancel={() => setDiscard(false)}
          onConfirm={() =>
            router.canGoBack() ? router.back() : router.replace("/reception/bookings")
          }
        />
      )}
    </Screen>
  );
}
