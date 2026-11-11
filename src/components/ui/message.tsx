import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { colors, radius } from "@/theme";

export function Message({
  children,
  kind = "error",
}: {
  children: ReactNode;
  kind?: "error" | "success" | "info";
}) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        padding: 12,
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor:
          kind === "error"
            ? colors.dangerSoft
            : kind === "success"
              ? colors.successBorder
              : colors.infoBorder,
        backgroundColor:
          kind === "error"
            ? colors.dangerSoft
            : kind === "success"
              ? colors.successSoft
              : colors.infoSoft,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          lineHeight: 22,
          color: kind === "error" ? colors.danger : colors.ink,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
