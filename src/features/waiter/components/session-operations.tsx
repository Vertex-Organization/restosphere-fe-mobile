import { useState } from "react";
import { Text } from "react-native";
import {
  Button,
  ConfirmDialog,
  Field,
  FilterChip,
  Message,
  Section,
  Select,
  ui,
} from "@/components/ui";
import { useApp } from "@/store/app-store";
import { sessionItems } from "../selectors";
import type { TableSession } from "../types";

export function SessionOperations({ session }: { session: TableSession }) {
  const { state, busy, changeSession } = useApp();
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [guests, setGuests] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<"merge" | "split">();
  const [error, setError] = useState("");
  const allowed = (s: TableSession) =>
    !s.closedAt &&
    !s.guestLeftAt &&
    !s.paymentRequested &&
    (state.session?.role === "RECEPTIONIST" || s.waiterId === state.session?.id);
  if (!allowed(session)) return null;
  const count = Number(guests);
  const available = state.tables.filter(
    (t) =>
      t.status === "AVAILABLE" &&
      state.areas.find((a) => a.id === t.areaId)?.active !== false &&
      !state.tableSessions.some((s) => s.tableId === t.id && !s.closedAt),
  );
  return (
    <Section title="Ghép / tách bàn">
      <Text style={ui.muted}>
        Không ghép/tách khi có cọc, giảm giá, thanh toán hoặc QR đang chờ. Máy chủ kiểm tra lại
        trước khi lưu.
      </Text>
      {!!error && <Message>{error}</Message>}
      <Select
        label="Bàn ghép vào hóa đơn này"
        value={source}
        onChange={setSource}
        options={[
          { value: "", label: "Chọn bàn đang phục vụ" },
          ...state.tableSessions
            .filter((s) => s.id !== session.id && allowed(s))
            .map((s) => ({
              value: s.id,
              label: state.tables.find((t) => t.id === s.tableId)?.code ?? s.tableId,
            })),
        ]}
      />
      <Button title="Ghép hóa đơn" disabled={busy || !source} onPress={() => setConfirm("merge")} />
      <Select
        label="Bàn trống nhận khách"
        value={target}
        onChange={setTarget}
        options={[
          { value: "", label: "Chọn bàn trống" },
          ...available.map((t) => ({ value: t.id, label: `${t.code} · ${t.capacity} chỗ` })),
        ]}
      />
      <Field
        label={`Số khách chuyển (nhỏ hơn ${session.guests ?? "số khách hiện tại"}) *`}
        value={guests}
        onChangeText={setGuests}
        keyboardType="number-pad"
      />
      {sessionItems(state, session.id)
        .filter((i) => !["DRAFT", "CANCELLED", "VOIDED", "REJECTED"].includes(i.status))
        .map((i) => (
          <FilterChip
            key={i.id}
            title={`${i.quantity} × ${i.name}`}
            selected={items.includes(i.id)}
            onPress={() =>
              setItems(items.includes(i.id) ? items.filter((id) => id !== i.id) : [...items, i.id])
            }
          />
        ))}
      <Button
        title="Tách sang bàn mới"
        disabled={
          busy ||
          !target ||
          !items.length ||
          !Number.isInteger(count) ||
          count < 1 ||
          session.guests == null ||
          count >= session.guests
        }
        onPress={() => setConfirm("split")}
      />
      {confirm && (
        <ConfirmDialog
          title={confirm === "merge" ? "Ghép hóa đơn" : "Tách bàn"}
          message={
            confirm === "merge"
              ? "Các bàn giữ phiên riêng và dùng chung hóa đơn."
              : `Chuyển ${count} khách và các món đã chọn sang bàn mới, hóa đơn riêng.`
          }
          onCancel={() => setConfirm(undefined)}
          onConfirm={async () => {
            try {
              await changeSession(
                confirm === "merge"
                  ? { type: "merge", sessionId: session.id, sourceSessionId: source }
                  : {
                      type: "split",
                      sessionId: session.id,
                      targetTableId: target,
                      itemIds: items,
                      guestCount: count,
                    },
              );
              setItems([]);
              setSource("");
              setTarget("");
              setGuests("");
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
            setConfirm(undefined);
          }}
        />
      )}
    </Section>
  );
}
