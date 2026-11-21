import { Pressable, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme";
import { AppIcon, type IconName } from "./app-icon";
import { useApp } from "@/store/app-store";

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  testID,
  icon,
  style,
  accessibilityLabel,
  size = "md",
}: {
  title: string;
  onPress(): void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  testID?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  size?: "sm" | "md";
}) {
  const { busy } = useApp();
  disabled = disabled || busy;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: size === "sm" ? 44 : 48,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: size === "sm" ? 10 : 12,
          paddingHorizontal: size === "sm" ? 12 : 16,
          borderRadius: radius.control,
          borderCurve: "continuous",
          flexDirection: "row",
          gap: 8,
          borderWidth: 1,
          borderColor:
            variant === "primary"
              ? colors.primary
              : variant === "danger"
                ? colors.dangerSoft
                : colors.border,
          backgroundColor:
            variant === "primary"
              ? pressed
                ? colors.primaryPressed
                : colors.primary
              : variant === "danger"
                ? colors.dangerSoft
                : pressed
                  ? colors.surface
                  : colors.white,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <AppIcon
          name={icon}
          size={19}
          color={
            variant === "primary" ? colors.white : variant === "danger" ? colors.danger : colors.ink
          }
        />
      )}
      <Text
        style={{
          color:
            variant === "primary"
              ? colors.white
              : variant === "danger"
                ? colors.danger
                : colors.ink,
          fontSize: 15,
          fontWeight: "600",
          flexShrink: 1,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  icon,
  label,
  onPress,
  selected = false,
}: {
  icon: IconName;
  label: string;
  onPress(): void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: radius.control,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected ? colors.primarySoft : pressed ? colors.surface : colors.white,
        borderWidth: 1,
        borderColor: selected ? colors.primaryBorder : colors.border,
      })}
    >
      <AppIcon name={icon} color={selected ? colors.primary : colors.ink} size={21} />
    </Pressable>
  );
}
