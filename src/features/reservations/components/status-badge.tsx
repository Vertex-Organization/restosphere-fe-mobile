import { Text, View } from "react-native";
import { AppIcon, ui, type IconName } from "@/components/ui";
import { TABLE_LABELS } from "@/features/tables/labels";
import type { TableStatus } from "@/features/tables/types";
import { colors, radius } from "@/theme";
import { STATUS_LABELS } from "../labels";
import type { ReservationStatus } from "../types";

export function statusTone(status: ReservationStatus | TableStatus) {
  if (["REJECTED", "CANCELLED"].includes(status))
    return { ink: colors.danger, background: colors.dangerSoft };
  if (["PENDING", "CLEANING", "NO_SHOW"].includes(status))
    return { ink: colors.warning, background: colors.warningSoft };
  if (["AVAILABLE", "COMPLETED", "ARRIVED"].includes(status))
    return { ink: colors.success, background: colors.successSoft };
  if (["CONFIRMED", "SEATED", "OCCUPIED"].includes(status))
    return { ink: colors.info, background: colors.infoSoft };
  return { ink: colors.muted, background: colors.background };
}
export function StatusBadge({ status }: { status: ReservationStatus | TableStatus }) {
  const tone = statusTone(status);
  const label =
    status in STATUS_LABELS
      ? STATUS_LABELS[status as ReservationStatus]
      : TABLE_LABELS[status as TableStatus];
  const icon: IconName = ["AVAILABLE", "COMPLETED"].includes(status)
    ? "checkmark-circle-outline"
    : ["ARRIVED", "SEATED", "OCCUPIED"].includes(status)
      ? "people-outline"
      : status === "CONFIRMED"
        ? "calendar-outline"
        : status === "CLEANING"
          ? "brush-outline"
          : ["PENDING", "NO_SHOW"].includes(status)
            ? "time-outline"
            : "remove-circle-outline";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: radius.badge,
        alignSelf: "flex-start",
        backgroundColor: tone.background,
      }}
    >
      <AppIcon name={icon} size={14} color={tone.ink} />
      <Text style={[ui.caption, { fontWeight: "500", color: tone.ink, flexShrink: 1 }]}>
        {label}
      </Text>
    </View>
  );
}
