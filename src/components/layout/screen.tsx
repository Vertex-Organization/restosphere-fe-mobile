import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Message, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors } from "@/theme";

export function Screen({
  children,
  scroll = true,
  login = false,
  tabbed = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  login?: boolean;
  tabbed?: boolean;
}) {
  const { notice, storageError, retrySave, dismissNotice, busy } = useApp();
  return (
    <SafeAreaView
      edges={
        login ? ["top", "bottom", "left", "right"] : tabbed ? ["left", "right"] : ["bottom", "left", "right"]
      }
      style={{
        flex: 1,
        backgroundColor: colors.background,
        overflow: "hidden",
      }}
    >
      {!!storageError && (
        <View style={{ padding: 10, gap: 6 }}>
          <Message>{storageError}</Message>
          <Button title="Tải lại từ máy chủ" onPress={retrySave} variant="secondary" />
        </View>
      )}
      {busy && <Message>Đang gửi thao tác tới máy chủ…</Message>}
      {!!notice && !login && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng thông báo thành công"
          onPress={dismissNotice}
          style={{ paddingHorizontal: 16, paddingTop: 8 }}
        >
          <Message kind="success">✓ {notice}</Message>
        </Pressable>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={login ? 0 : 100}
        style={{ flex: 1 }}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={ui.content}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
