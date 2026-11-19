import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AppIcon, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors, radius, typography } from "@/theme";
import { lateMinutes, timeLabel } from "@/utils/dates";
import { tableCode } from "@/features/tables/labels";
import { STATUS_LABELS } from "../labels";
import type { Reservation } from "../types";
import { StatusBadge, statusTone } from "./status-badge";

export function ReservationListItem({ reservation: r, onPress, trailing }: { reservation: Reservation; onPress?(): void; trailing?: React.ReactNode }) {
  const { now, state } = useApp();
  const late = r.status === "CONFIRMED" ? lateMinutes(r, now) : 0;
  const tone = statusTone(r.status);
  return (
    <View style={{ backgroundColor: colors.white, borderRadius: radius.control, borderCurve: "continuous", overflow: "hidden", borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: late > 0 ? colors.warning : tone.ink }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${r.code}, ${r.customer.name}, ${STATUS_LABELS[r.status]}`}
        onPress={onPress ?? (() => router.push(`/reception/reservations/${r.id}`))}
        style={({ pressed }) => ({ padding: 12, gap: 10, backgroundColor: pressed ? colors.surface : colors.white })}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <View style={{ minWidth: 50, paddingVertical: 2, gap: 2 }}>
            <Text style={{ ...typography.heading, color: late > 0 ? colors.warning : colors.ink, fontVariant: ["tabular-nums"] }}>{timeLabel(r.startsAt)}</Text>
            <Text style={ui.caption}>{r.duration} phút</Text>
          </View>
          <View style={{ width: 1, alignSelf: "stretch", backgroundColor: colors.border }} />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Text style={[ui.text, { fontWeight: "600", flex: 1 }]}>{r.customer.name}</Text>
              <AppIcon name="chevron-forward" size={16} color={colors.subtle} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <AppIcon name="people-outline" size={14} color={colors.muted} />
              <Text style={ui.caption}>{r.actualGuests ?? r.guests} khách</Text>
              <Text style={ui.caption}>·</Text>
              <Text style={ui.caption}>{r.tableId ? `Bàn ${tableCode(state.tables, r.tableId)}` : "Chưa gán bàn"}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <StatusBadge status={r.status} />
          <Text style={[ui.caption, { fontVariant: ["tabular-nums"] }]}>{r.code}</Text>
        </View>
        {late > 0 && <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><AppIcon name="alert-circle-outline" size={14} color={colors.warning} /><Text style={[ui.caption, { color: colors.warning }]}>Trễ {late} phút · Khách chưa đến</Text></View>}
      </Pressable>
      {trailing && <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>{trailing}</View>}
    </View>
  );
}
