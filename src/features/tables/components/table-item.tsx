import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AppIcon, ui } from "@/components/ui";
import { StatusBadge, statusTone } from "@/features/reservations/components/status-badge";
import { endsAt, heldRange, holdsTable } from "@/features/reservations/rules";
import { useApp } from "@/store/app-store";
import { colors, radius } from "@/theme";
import { dateTimeLabel, timeLabel } from "@/utils/dates";
import { TABLE_LABELS } from "../labels";
import type { RestaurantTable } from "../types";

export function TableItem({ table: t, onPress, reason, selected, compact = false }: { table: RestaurantTable; onPress?(): void; reason?: string; selected?: boolean; compact?: boolean }) {
  const { state } = useApp();
  const next = state.reservations.filter((r) => r.tableId === t.id && holdsTable(r)).sort((a, b) => new Date(heldRange(a).startsAt).getTime() - new Date(heldRange(b).startsAt).getTime())[0];
  const latest = state.reservations.filter((r) => r.tableId === t.id).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())[0];
  const tone = statusTone(t.status);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Bàn ${t.code}, ${t.capacity} chỗ, ${TABLE_LABELS[t.status]}`}
      accessibilityState={{ selected, disabled: !!reason }} disabled={!!reason}
      onPress={onPress ?? (() => router.push(`/reception/tables/${t.id}`))}
      style={({ pressed }) => [ui.panel, {
        padding: compact ? 14 : 16, flex: compact ? 1 : undefined, gap: compact ? 14 : 12,
        borderColor: selected ? colors.primary : "transparent", borderWidth: 2,
        backgroundColor: selected ? colors.primarySoft : pressed ? colors.surface : colors.white,
        opacity: reason ? 0.6 : 1,
      }]}>
      {compact ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <AppIcon name="restaurant-outline" size={21} color={tone.ink} />
            <Text style={ui.caption}>{t.capacity} chỗ</Text>
          </View>
          <View style={{ gap: 3 }}>
            <Text style={[ui.title, { fontSize: 27 }]}>{t.code}</Text>
            <Text style={ui.caption}>{state.areas.find((a) => a.id === t.areaId)?.name}</Text>
          </View>
          <StatusBadge status={t.status} />
          {next && <Text style={[ui.caption, { color: colors.primary }]}>{next.status === "SEATED" ? "Đang dùng bàn" : `Giữ lúc ${timeLabel(heldRange(next).startsAt)}`}</Text>}
        </>
      ) : (
        <>
          <View style={[ui.row, { justifyContent: "space-between" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.control, backgroundColor: tone.background, alignItems: "center", justifyContent: "center" }}>
                <AppIcon name={selected ? "checkmark-circle" : "restaurant-outline"} size={23} color={tone.ink} />
              </View>
              <View style={{ gap: 2 }}><Text style={ui.heading}>{t.code}</Text><Text style={ui.muted}>{t.capacity} chỗ</Text></View>
            </View>
            <StatusBadge status={t.status} />
          </View>
          <Text style={ui.muted}>{state.areas.find((a) => a.id === t.areaId)?.name}</Text>
          {next ? <Text style={ui.muted}>{next.status === "SEATED" ? "Đang dùng" : "Giữ bàn"}: {dateTimeLabel(heldRange(next).startsAt)} – {timeLabel(endsAt(heldRange(next)))}</Text>
            : <Text style={ui.caption}>{latest ? `Lịch gần nhất: ${latest.code} · ${dateTimeLabel(latest.startsAt)}` : "Chưa có lịch liên quan"}</Text>}
        </>
      )}
      {reason && <Text style={[ui.caption, { color: colors.danger }]}>{reason}</Text>}
    </Pressable>
  );
}
