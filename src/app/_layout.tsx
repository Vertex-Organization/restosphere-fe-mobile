import "@/features/auth/dev-api-url";
import { Stack } from "expo-router";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { Loading } from "@/components/ui";
import { isReceptionist, isWaiter } from "@/features/auth/roles";
import { AppProvider, useApp } from "@/store/app-store";
import { colors } from "@/theme";

export { ErrorBoundary } from "expo-router";

function Navigation() {
  const { state, ready } = useApp();
  if (!ready) return <Loading />;
  const receptionist = isReceptionist(state.session?.role);
  const waiter = isWaiter(state.session?.role);
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={!receptionist && !waiter}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={receptionist}>
          <Stack.Screen name="reception" />
        </Stack.Protected>
        <Stack.Protected guard={waiter}>
          <Stack.Screen name="waiter" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <Navigation />
    </AppProvider>
  );
}
