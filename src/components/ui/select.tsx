import { Host, Picker } from "@expo/ui";
import { Text, View } from "react-native";
import { colors, radius } from "@/theme";
import { ui } from "./styles";

export function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange(value: string): void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.label}>
        {label}
      </Text>
      <Host
        colorScheme="light"
        seedColor={colors.primary}
        matchContents={{ vertical: true }}
        style={{
          width: "100%",
          minHeight: 48,
          backgroundColor: colors.white,
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Picker
          selectedValue={value}
          enabled={!disabled}
          onValueChange={onChange}
          appearance="menu"
        >
          {options.map((o) => (
            <Picker.Item key={o.value} value={o.value} label={o.label} />
          ))}
        </Picker>
      </Host>
    </View>
  );
}
