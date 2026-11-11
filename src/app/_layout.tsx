import { Stack } from "expo-router";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import { Loading } from "@/components/ui";
import { isReceptionist } from "@/features/auth/roles";
import { AppProvider, useApp } from "@/store/app-store";
import { colors } from "@/theme";

export { ErrorBoundary } from "expo-router";

function Navigation() {
  const { state, ready } = useApp();
  if (!ready) return <Loading />;
  // One protected workspace per role. Add waiter, cashier, kitchen and admin
  // here with their own guard once their routes exist.
  const receptionist = isReceptionist(state.session?.role);
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
        <Stack.Protected guard={!receptionist}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={receptionist}>
          <Stack.Screen name="reception" />
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
