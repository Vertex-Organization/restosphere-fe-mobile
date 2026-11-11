import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/brand-logo";
import { AppIcon } from "@/components/ui";
import { ROLE_LABELS } from "@/features/auth/roles";
import { useWideLayout } from "@/hooks/use-wide-layout";
import { useApp } from "@/store/app-store";
import { colors, layout, radius, typography } from "@/theme";

export function WorkspaceHeader({
  title,
  notificationsHref,
  profileHref,
}: {
  title: string;
  notificationsHref: Href;
  profileHref: Href;
}) {
  const { state } = useApp();
  const insets = useSafeAreaInsets();
  const wide = useWideLayout();
  const unread = state.notifications.filter((n) => !n.read).length;
  const initials = state.session?.name.split(" ").slice(-2).map((part) => part[0]).join("");
  const actions = (
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Thông báo, ${unread} chưa đọc`}
        onPress={() => router.push(notificationsHref)}
        style={({ pressed }) => [styles.iconButton, { backgroundColor: pressed ? colors.surface : colors.white }]}
      >
        <AppIcon name="notifications-outline" size={22} color={colors.ink} />
        {unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text></View>}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mở thông tin cá nhân"
        onPress={() => router.navigate(profileHref)}
        style={({ pressed }) => [styles.avatar, { opacity: pressed ? 0.65 : 1 }]}
      >
        <Text style={styles.initials}>{initials}</Text>
      </Pressable>
    </View>
  );
  // On wide screens the sidebar already carries the brand and the role.
  if (wide)
    return (
      <View style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <View style={[styles.inner, styles.wideRow]}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {actions}
        </View>
      </View>
    );
  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.brand}><BrandLogo width={176} /></View>
          {actions}
        </View>
        <View style={styles.bottomRow}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {state.session && (
            <View style={styles.role}><View style={styles.dot} /><Text style={styles.roleText}>{ROLE_LABELS[state.session.role]}</Text></View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.background, paddingHorizontal: layout.pagePadding, paddingBottom: 4 },
  inner: { width: "100%", maxWidth: layout.maxWidth - layout.pagePadding * 2, alignSelf: "center", gap: 12 },
  wideRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  brand: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.primaryBorder },
  initials: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { ...typography.title, color: colors.ink, flex: 1 },
  role: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleText: { ...typography.caption, color: colors.muted },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  badge: { position: "absolute", top: 0, right: 0, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
});
