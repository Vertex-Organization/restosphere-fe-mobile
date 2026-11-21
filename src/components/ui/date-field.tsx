import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { colors } from "@/theme";
import { dateLabel, timeLabel } from "@/utils/dates";
import { Button } from "./button";
import { ui } from "./styles";
export interface DateFieldProps {
  label: string;
  value: Date;
  onChange(value: Date): void;
  mode?: "date" | "time";
}
export function DateField({ label, value, onChange, mode = "date" }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.label}>{label}</Text>
      <Button
        title={mode === "date" ? dateLabel(value) : timeLabel(value)}
        variant="secondary"
        icon={mode === "date" ? "calendar-outline" : "time-outline"}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <View>
          <DateTimePicker
            value={value}
            mode={mode}
            locale="vi-VN"
            is24Hour
            themeVariant="light"
            accentColor={colors.primary}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            positiveButton={{ label: "Chọn" }}
            negativeButton={{ label: "Hủy" }}
            onValueChange={(_event, date) => {
              const next = new Date(value);
              if (mode === "date")
                next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
              else next.setHours(date.getHours(), date.getMinutes(), 0, 0);
              onChange(next);
              if (Platform.OS !== "ios") setOpen(false);
            }}
            onDismiss={() => setOpen(false)}
          />
          {Platform.OS === "ios" && (
            <Button title="Xong" variant="secondary" onPress={() => setOpen(false)} />
          )}
        </View>
      )}
    </View>
  );
}
