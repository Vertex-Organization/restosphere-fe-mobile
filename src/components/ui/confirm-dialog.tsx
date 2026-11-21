import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme";
import { Button } from "./button";
import { Field } from "./field";
import { Message } from "./message";
import { ui } from "./styles";

export function ConfirmDialog({
  title,
  message,
  requireReason = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  requireReason?: boolean;
  onConfirm(reason: string): void;
  onCancel(): void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "center",
          padding: 20,
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          >
            <View
              accessibilityViewIsModal
              style={[ui.panel, { width: "100%", maxWidth: 480, alignSelf: "center", gap: 16 }]}
            >
              <Text accessibilityRole="header" style={ui.heading}>
                {title}
              </Text>
              <Text style={ui.text}>{message}</Text>
              {requireReason && (
                <Field
                  label="Lý do *"
                  multiline
                  value={reason}
                  onChangeText={setReason}
                  autoFocus
                />
              )}
              {!!error && <Message>{error}</Message>}
              <Button
                title="Xác nhận"
                onPress={() => {
                  if (requireReason && !reason.trim()) return setError("Vui lòng nhập lý do.");
                  onConfirm(reason);
                }}
              />
              <Button title="Quay lại" variant="secondary" onPress={onCancel} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
