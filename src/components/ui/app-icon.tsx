import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { colors } from "@/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export function AppIcon({
  name,
  size = 22,
  color = colors.primary,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue | null;
}) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={typeof color === "number" || color == null ? colors.primary : color}
      accessible={false}
    />
  );
}
