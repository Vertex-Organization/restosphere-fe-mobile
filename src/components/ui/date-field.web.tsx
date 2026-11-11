import { Text, View } from "react-native";
import { colors, radius } from "@/theme";
import { dayKey, timeLabel } from "@/utils/dates";
import type { DateFieldProps } from "./date-field";
import { ui } from "./styles";
export function DateField({
  label,
  value,
  onChange,
  mode = "date",
}: DateFieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.label}>{label}</Text>
      <input
        aria-label={label}
        type={mode}
        value={mode === "date" ? dayKey(value) : timeLabel(value)}
        style={{
          minHeight: 48,
          padding: 12,
          boxSizing: "border-box",
          borderRadius: radius.control,
          border: `1px solid ${colors.border}`,
          fontSize: 16,
          color: colors.ink,
          background: colors.white,
          width: "100%",
          minWidth: 0,
          fontFamily: "inherit",
          colorScheme: "light",
        }}
        onChange={(event) => {
          if (!event.target.value) return;
          const next = new Date(value);
          if (mode === "date") {
            const [y, m, d] = event.target.value.split("-").map(Number);
            next.setFullYear(y, m - 1, d);
          } else {
            const [h, m] = event.target.value.split(":").map(Number);
            next.setHours(h, m, 0, 0);
          }
          if (Number.isFinite(next.getTime())) onChange(next);
        }}
      />
    </View>
  );
}
