import { useState, type ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius } from "@/theme";
import { AppIcon, type IconName } from "./app-icon";
import { ui } from "./styles";

export function Field({
  label,
  error,
  icon,
  trailing,
  ...props
}: TextInputProps & { label: string; error?: string; icon?: IconName; trailing?: ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.label}>{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: props.multiline ? "flex-start" : "center",
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
          backgroundColor: colors.white,
          paddingLeft: icon ? 12 : 0,
        }}
      >
        {icon && <AppIcon name={icon} size={20} color={colors.subtle} />}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.subtle}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            {
              minHeight: 48,
              flex: 1,
              minWidth: 0,
              backgroundColor: colors.white,
              color: colors.ink,
              fontSize: 16,
              padding: 12,
              borderRadius: radius.control,
              textAlignVertical: props.multiline ? "top" : "center",
            },
            props.style,
          ]}
        />
        {trailing}
      </View>
      {error && (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function SearchInput({
  value,
  onChangeText,
  placeholder = "Tên khách, số điện thoại, mã đặt bàn…",
}: {
  value: string;
  onChangeText(value: string): void;
  placeholder?: string;
}) {
  return (
    <Field
      label="Tìm kiếm"
      icon="search-outline"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
    />
  );
}
