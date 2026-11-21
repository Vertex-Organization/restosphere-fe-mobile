import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AppIcon, ui, type IconName } from "@/components/ui";
import { statusTone } from "@/features/reservations/components/status-badge";
import { endsAt, heldRange, holdsTable } from "@/features/reservations/rules";
import { useApp } from "@/store/app-store";
import { colors, radius } from "@/theme";
import { dateTimeLabel, timeLabel } from "@/utils/dates";
import { TABLE_LABELS } from "../labels";
import type { RestaurantTable } from "../types";

export function TableItem({
  table: t,
  onPress,
  reason,
  selected,
  compact = false,
}: {
  table: RestaurantTable;
  onPress?(): void;
  reason?: string;
  selected?: boolean;
  compact?: boolean;
}) {
  const { state, now } = useApp();
  const next = state.reservations
    .filter(
      (r) =>
        r.tableId === t.id &&
        holdsTable(r) &&
        (r.status === "SEATED" || endsAt(heldRange(r)) > now),
    )
    .sort(
      (a, b) =>
        Number(b.status === "SEATED") - Number(a.status === "SEATED") ||
        new Date(heldRange(a).startsAt).getTime() - new Date(heldRange(b).startsAt).getTime(),
    )[0];
  const latest = state.reservations
    .filter((r) => r.tableId === t.id)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())[0];
  const tone = statusTone(t.status);
  const icons: Record<RestaurantTable["status"], IconName> = {
    AVAILABLE: "checkmark-circle-outline",
    OCCUPIED: "people-outline",
    CLEANING: "brush-outline",
    OUT_OF_SERVICE: "remove-circle-outline",
  };
  const held = next && next.status !== "SEATED";
  const current = next?.status === "SEATED" ? next : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Bàn ${t.code}, ${t.capacity} chỗ, ${TABLE_LABELS[t.status]}${held ? `, giữ lúc ${timeLabel(heldRange(next).startsAt)}` : ""}`}
      accessibilityState={{ selected, disabled: !!reason }}
      disabled={!!reason}
      onPress={onPress ?? (() => router.push(`/reception/tables/${t.id}`))}
      style={({ pressed }) => [
        ui.panel,
        {
          padding: compact ? 12 : 16,
          flex: compact ? 1 : undefined,
          gap: 10,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: 1,
          borderLeftWidth: 4,
          borderLeftColor: selected ? colors.primary : tone.ink,
          backgroundColor: selected ? colors.primarySoft : pressed ? colors.surface : colors.white,
          opacity: reason ? 0.6 : 1,
        },
      ]}
    >
      {compact ? (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
            }}
          >
            <Text style={[ui.title, { fontVariant: ["tabular-nums"] }]}>{t.code}</Text>
            <Text style={ui.caption}>{t.capacity} chỗ</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <AppIcon name={icons[t.status]} size={16} color={tone.ink} />
            <Text style={[ui.label, { color: tone.ink, flexShrink: 1, fontWeight: "600" }]}>
              {TABLE_LABELS[t.status]}
            </Text>
          </View>
          <Text style={ui.caption}>{state.areas.find((a) => a.id === t.areaId)?.name}</Text>
          {held ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <AppIcon name="calendar-outline" size={14} color={colors.info} />
              <Text style={[ui.caption, { color: colors.info, flexShrink: 1 }]}>
                Giữ lúc {timeLabel(heldRange(next).startsAt)}
              </Text>
            </View>
          ) : current ? (
            <Text
              style={[
                ui.caption,
                { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
              ]}
              numberOfLines={1}
            >
              {current.customer.name}
            </Text>
          ) : (
            <Text
              style={[
                ui.caption,
                { paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              {t.status === "AVAILABLE"
                ? "Chưa có lịch giữ"
                : t.status === "CLEANING"
                  ? "Chờ hoàn tất dọn"
                  : t.status === "OUT_OF_SERVICE"
                    ? "Chưa thể đón khách"
                    : "Đang phục vụ"}
            </Text>
          )}
        </>
      ) : (
        <>
          <View style={[ui.row, { justifyContent: "space-between" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.control,
                  backgroundColor: tone.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon
                  name={selected ? "checkmark-circle" : icons[t.status]}
                  size={23}
                  color={tone.ink}
                />
              </View>
              <View style={{ gap: 2 }}>
                <Text style={ui.heading}>{t.code}</Text>
                <Text style={ui.muted}>{t.capacity} chỗ</Text>
              </View>
            </View>
            <Text style={[ui.label, { color: tone.ink }]}>{TABLE_LABELS[t.status]}</Text>
          </View>
          <Text style={ui.muted}>{state.areas.find((a) => a.id === t.areaId)?.name}</Text>
          {next ? (
            <Text style={ui.muted}>
              {next.status === "SEATED" ? "Đang dùng" : "Giữ bàn"}:{" "}
              {dateTimeLabel(heldRange(next).startsAt)} – {timeLabel(endsAt(heldRange(next)))}
            </Text>
          ) : (
            <Text style={ui.caption}>
              {latest
                ? `Lịch gần nhất: ${latest.code} · ${dateTimeLabel(latest.startsAt)}`
                : "Chưa có lịch liên quan"}
            </Text>
          )}
        </>
      )}
      {reason && <Text style={[ui.caption, { color: colors.danger }]}>{reason}</Text>}
    </Pressable>
  );
}
