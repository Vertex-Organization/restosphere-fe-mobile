import { Tabs, type Href } from "expo-router";
import {
  BottomTabBar,
  type BottomTabBarProps,
  type BottomTabNavigationOptions,
} from "expo-router/tabs";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/brand-logo";
import { AppIcon, type IconName } from "@/components/ui";
import { ROLE_LABELS } from "@/features/auth/roles";
import { useWideLayout } from "@/hooks/use-wide-layout";
import { useApp } from "@/store/app-store";
import { colors, layout, radius, typography } from "@/theme";
import { WorkspaceHeader } from "./workspace-header";

export interface WorkspaceTab {
  name: string;
  title: string;
  tabLabel?: string;
  icon: IconName;
  activeIcon: IconName;
}

/**
 * Main navigation of a role workspace (reception, cashier, …): a bottom tab
 * bar on phones and portrait tablets, a left sidebar on wide screens.
 */
export function WorkspaceTabs({
  tabs,
  notificationsHref,
  profileHref,
}: {
  tabs: WorkspaceTab[];
  notificationsHref: Href;
  profileHref: Href;
}) {
  const insets = useSafeAreaInsets();
  const wide = useWideLayout();
  const barOptions: BottomTabNavigationOptions = wide
    ? {
        tabBarPosition: "left",
        tabBarLabelPosition: "beside-icon",
        tabBarActiveBackgroundColor: colors.primarySoft,
        tabBarLabelStyle: { fontSize: 15, fontWeight: "600" },
        tabBarIconStyle: { marginStart: 8 },
        tabBarItemStyle: { marginVertical: 2 },
        tabBarStyle: styles.sidebarTabs,
      }
    : {
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", paddingBottom: 0, marginTop: 4 },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarItemStyle: { paddingTop: 0 },
      };
  return (
    <Tabs
      tabBar={wide ? renderSidebar : undefined}
      screenOptions={{
        header: ({ options, route }) => (
          <WorkspaceHeader
            title={options.title ?? route.name}
            notificationsHref={notificationsHref}
            profileHref={profileHref}
          />
        ),
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        ...barOptions,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarLabel: tab.tabLabel ?? tab.title,
            tabBarIcon: ({ color, focused }) => {
              const icon = (
                <AppIcon name={focused ? tab.activeIcon : tab.icon} size={21} color={color} />
              );
              if (wide) return icon;
              return (
                <View style={[styles.iconPill, focused && styles.iconPillActive]}>{icon}</View>
              );
            },
          }}
        />
      ))}
    </Tabs>
  );
}

const renderSidebar = (props: BottomTabBarProps) => <Sidebar {...props} />;

function Sidebar(props: BottomTabBarProps) {
  const { state } = useApp();
  const staff = state.session;
  const { insets } = props;
  return (
    <View
      style={[
        styles.sidebar,
        { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20, paddingLeft: insets.left + 16 },
      ]}
    >
      <View style={styles.brand}>
        <BrandLogo width={184} />
      </View>
      {/* The default tab bar keeps links, hover and accessibility; the wrapper owns the insets. */}
      <BottomTabBar {...props} insets={{ top: 0, right: 0, bottom: 0, left: 0 }} />
      {staff && (
        <View style={styles.account}>
          <View style={styles.dot} />
          <View style={styles.accountText}>
            <Text style={styles.accountRole}>{ROLE_LABELS[staff.role]}</Text>
            <Text style={styles.accountName} numberOfLines={1}>
              {staff.name}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconPill: { width: 48, height: 28, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "transparent" },
  iconPillActive: { backgroundColor: colors.primarySoft },
  sidebar: {
    width: layout.sidebarWidth,
    paddingRight: 16,
    gap: 28,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  brand: { paddingHorizontal: 8 },
  sidebarTabs: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "transparent",
    borderRightWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingStart: 0,
    paddingEnd: 0,
  },
  account: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.control, backgroundColor: colors.background },
  accountText: { flex: 1, minWidth: 0 },
  accountRole: { ...typography.label, color: colors.ink },
  accountName: { ...typography.caption, color: colors.muted },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
});
