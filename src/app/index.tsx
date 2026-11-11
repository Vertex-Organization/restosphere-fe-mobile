import { Redirect } from "expo-router";
import { isReceptionist } from "@/features/auth/roles";
import { useApp } from "@/store/app-store";

// Sends a signed-in employee to their workspace home.
export default function Index() {
  const { state } = useApp();
  return (
    <Redirect
      href={isReceptionist(state.session?.role) ? "/reception/overview" : "/login"}
    />
  );
}
