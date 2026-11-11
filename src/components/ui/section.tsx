import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@/theme";
import { ui } from "./styles";

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 16, paddingTop: 8 }}>
      <Text accessibilityRole="header" style={ui.heading}>
        {title}
      </Text>
      {children}
    </View>
  );
}
export function SectionHeader({
  title, count, action, onPress,
}: { title: string; count?: number; action?: string; onPress?(): void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text accessibilityRole="header" style={[ui.heading, { flexShrink: 1 }]}>{title}</Text>
        {count !== undefined && <Text style={[ui.caption, { color: colors.primary, fontWeight: "600" }]}>{count}</Text>}
      </View>
      {action && onPress && (
        <Pressable accessibilityRole="button" onPress={onPress}
          style={({ pressed }) => ({ minHeight: 44, paddingLeft: 8, justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
          <Text style={[ui.label, { color: colors.primary }]}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}
