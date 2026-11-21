import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function WaiterLayout() {
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
      <Stack.Screen name="tables/[id]" options={{ title: "Chi tiết bàn" }} />
      <Stack.Screen name="menu" options={{ title: "Thực đơn / gọi món" }} />
      <Stack.Screen name="catalog" options={{ title: "Tra cứu thực đơn" }} />
      <Stack.Screen name="cart" options={{ title: "Giỏ món chưa gửi" }} />
      <Stack.Screen name="progress" options={{ title: "Theo dõi món" }} />
      <Stack.Screen name="payment" options={{ title: "Yêu cầu thanh toán" }} />
      <Stack.Screen name="finish" options={{ title: "Kết thúc / dọn bàn" }} />
      <Stack.Screen name="notifications" options={{ title: "Thông báo" }} />
      <Stack.Screen name="history" options={{ title: "Lịch sử phục vụ" }} />
    </Stack>
  );
}
