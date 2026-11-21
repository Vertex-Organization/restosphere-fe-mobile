import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";
import { ui } from "./styles";

export function DetailRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <View
      style={{
        gap: 4,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      <Text style={ui.muted}>{label}</Text>
      <Text selectable style={ui.text}>
        {value === undefined || value === "" ? "Chưa có" : value}
      </Text>
    </View>
  );
}
