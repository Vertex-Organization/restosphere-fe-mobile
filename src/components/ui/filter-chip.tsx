import { Pressable, Text } from "react-native";
import { colors, radius } from "@/theme";
import { ui } from "./styles";

export function FilterChip({
  title, selected, onPress,
}: { title: string; selected: boolean; onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44, paddingHorizontal: 16, paddingVertical: 11,
        justifyContent: "center", borderRadius: radius.full,
        backgroundColor: selected ? colors.primaryDark : pressed ? colors.surface : colors.white,
      })}
    >
      <Text style={[ui.label, { color: selected ? colors.white : colors.muted }]}>{title}</Text>
    </Pressable>
  );
}
