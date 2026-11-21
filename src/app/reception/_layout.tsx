import { Stack } from "expo-router";
import { colors } from "@/theme";

// Reception (lễ tân) workspace: tabs plus the detail screens pushed on top.
export default function ReceptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.ink,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerTitleStyle: { color: colors.ink, fontSize: 18 },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="reservations/[id]" options={{ title: "Chi tiết đặt bàn" }} />
      <Stack.Screen name="reservations/form" options={{ title: "Thông tin đặt bàn" }} />
      <Stack.Screen name="reservations/assign" options={{ title: "Gán / đổi bàn" }} />
      <Stack.Screen name="check-in" options={{ title: "Nhận khách" }} />
      <Stack.Screen name="walk-in" options={{ title: "Tiếp nhận khách trực tiếp" }} />
      <Stack.Screen name="handover" options={{ title: "Bàn giao cho phục vụ" }} />
      <Stack.Screen name="tables/[id]" options={{ title: "Chi tiết bàn" }} />
      <Stack.Screen name="notifications" options={{ title: "Thông báo" }} />
    </Stack>
  );
}
