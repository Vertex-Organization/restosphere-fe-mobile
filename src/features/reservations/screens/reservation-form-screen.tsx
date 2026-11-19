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
import { TableItem } from "@/features/tables/components/table-item";
import { useApp } from "@/store/app-store";
import { addMinutes } from "@/utils/dates";
import {
  getAvailableTables,
  getReservationActions,
  isTableAvailableForTimeRange,
  validateReservationInput,
} from "../rules";
import type { Reservation, ReservationInput } from "../types";
import { tableCode } from "@/features/tables/labels";

export default function ReservationFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, now } = useApp();
  const r = state.reservations.find((item) => item.id === id);
  if (
    id &&
    (!r || !getReservationActions(r, now, state.session!.role, state.settings.noShowMinutes).includes("edit"))
  )
    return (
      <Screen>
        <EmptyState
          title="Không thể chỉnh sửa lịch này"
          description="Chỉ sửa lịch đang chờ hoặc đã xác nhận, trước khi khách check-in."
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
  const [name, setName] = useState(r?.customer.name ?? "");
  const [phone, setPhone] = useState(r?.customer.phone ?? "");
  const [date, setDate] = useState(
    r ? new Date(r.startsAt) : addMinutes(now, 60),
  );
  const [guests, setGuests] = useState(String(r?.guests ?? 2));
  const [duration, setDuration] = useState(String(r?.duration ?? 90));
  const [areaId, setArea] = useState(r?.areaId ?? "");
  const [tableId, setTable] = useState(r?.tableId ?? "");
  const [notes, setNotes] = useState(r?.notes ?? "");
  const [specialRequests, setSpecial] = useState(r?.specialRequests ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const input: ReservationInput = {
    customer: { name, phone },
    startsAt: (walkIn ? now : date).toISOString(),
    guests: Number(guests),
    duration: Number(duration),
    areaId: areaId || undefined,
    tableId: tableId || undefined,
    notes,
    specialRequests,
    email: r?.email,
    occasion: r?.occasion,
    preorder: r?.preorder,
  };
  const available = getAvailableTables(state, input, r?.id, now).filter(
    (t) => !walkIn || t.status === "AVAILABLE",
  );
  const selected = state.tables.find((t) => t.id === tableId);
  const selectedCheck = selected
    ? isTableAvailableForTimeRange(state, selected, input, r?.id, now)
    : undefined;
  const invalidSelected = !!tableId && !available.some((t) => t.id === tableId);
  async function save() {
    const actualInput = {
      ...input,
      startsAt: walkIn ? new Date().toISOString() : input.startsAt,
    };
    const validation = validateReservationInput(
      actualInput,
      new Date(),
      !r || r.startsAt !== actualInput.startsAt,
      walkIn,
    );
    setErrors(validation);
    setError("");
    if (!name.trim() || !/^\+?[0-9]{8,15}$/.test(phone.replace(/[\s()-]/g, "")) || !areaId)
      return setError("Nhập tên khách, số điện thoại hợp lệ và chọn khu vực.");
    if (Object.keys(validation).length)
      return setError("Kiểm tra các trường được đánh dấu bên dưới.");
    try {
      const id = r
        ? (await run({ type: "edit", id: r.id, input: actualInput }), r.id)
        : await run({ type: "create", input: actualInput, walkIn });
      if (id)
        router.replace(`/reception/reservations/${id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Screen>
      <Stack.Screen
        options={{
          title: walkIn
            ? "Khách trực tiếp"
            : r
              ? `Sửa ${r.code}`
              : "Tạo đặt bàn",
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
            ? "Chọn bàn sẵn sàng, tạo lịch rồi xác nhận và check-in trước khi bàn giao."
          : "Lưu lịch chưa đồng nghĩa đã xác nhận. Lịch chờ chưa giữ bàn."}
      </Text>
      {!!error && <Message>{error}</Message>}
      <Section title="Thông tin khách">
        <Field
          label="Tên khách *"
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCapitalize="words"
        />
        <Field
          label="Số điện thoại *"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <Field
          label="Số khách *"
          value={guests}
          onChangeText={setGuests}
          keyboardType="number-pad"
          error={errors.guests}
        />
      </Section>
      {!walkIn && (
        <Section title="Thời gian">
          <DateField label="Ngày đặt *" value={date} onChange={setDate} />
          <DateField label="Giờ đến *" mode="time" value={date} onChange={setDate} />
          {errors.startsAt && <Message>{errors.startsAt}</Message>}
        </Section>
      )}
      <Field
        label="Thời lượng dự kiến (phút) *"
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        error={errors.duration}
      />
      <Select
        label="Khu vực *"
        value={areaId}
        onChange={(value) => {
          setArea(value);
          setTable("");
        }}
        options={[
          { value: "", label: "Chọn khu vực" },
          ...state.areas.map((a) => ({ value: a.id, label: a.name })),
        ]}
      />
      <Field label="Ghi chú" value={notes} onChangeText={setNotes} multiline />
      <Field
        label="Yêu cầu đặc biệt"
        value={specialRequests}
        onChangeText={setSpecial}
        multiline
      />
      {walkIn ? (
        <Section title="Chọn bàn sẵn sàng">
          {!available.length && (
            <Message>
              Không có bàn sẵn sàng đủ sức chứa và không trùng lịch. Chưa thể
              tiếp nhận khách.
            </Message>
          )}
          {state.tables
            .filter((t) => !areaId || t.areaId === areaId)
            .map((t) => {
              const check = isTableAvailableForTimeRange(
                state,
                t,
                input,
                undefined,
                now,
              );
              return (
                <TableItem
                  key={t.id}
                  table={t}
                  selected={tableId === t.id}
                  reason={
                    !check.ok
                      ? check.reason
                      : t.status !== "AVAILABLE"
                        ? "Bàn chưa sẵn sàng để tiếp nhận ngay."
                        : undefined
                  }
                  onPress={() => setTable(t.id)}
                />
              );
            })}
        </Section>
      ) : (
        <Select
          label="Bàn dự kiến"
          value={tableId}
          onChange={setTable}
          options={[
            {
              value: "",
              label:
                r?.status === "CONFIRMED"
                  ? "Cần chọn một bàn để giữ chỗ"
                  : "Chưa gán bàn",
            },
            ...(invalidSelected
              ? [
                  {
                    value: tableId,
                    label: `${tableCode(state.tables, tableId)} · Không còn phù hợp, cần chọn lại`,
                  },
                ]
              : []),
            ...available.map((t) => ({
              value: t.id,
              label: `${t.code} · ${t.capacity} chỗ · ${state.areas.find((a) => a.id === t.areaId)?.name}`,
            })),
          ]}
        />
      )}
      {selectedCheck && !selectedCheck.ok && (
        <Message>{selectedCheck.reason}</Message>
      )}
      {!available.length && !walkIn && (
        <Message>
          Không có bàn phù hợp khung giờ và số khách hiện tại. Hãy điều chỉnh
          thông tin trước khi lưu.
        </Message>
      )}
      <Button
        title={walkIn ? "Xác nhận khách đã đến · Tiếp tục" : "Lưu đặt bàn"}
        disabled={walkIn ? !tableId || invalidSelected : invalidSelected}
        onPress={save}
      />
      <Button
        title="Hủy thao tác"
        variant="secondary"
        onPress={() => setDiscard(true)}
      />
      {discard && (
        <ConfirmDialog
          title="Hủy thao tác"
          message="Bỏ nội dung chưa lưu và quay lại?"
          onCancel={() => setDiscard(false)}
          onConfirm={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/reception/bookings")
          }
        />
      )}
    </Screen>
  );
}
