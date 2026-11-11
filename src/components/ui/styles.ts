import { StyleSheet } from "react-native";
import { colors, layout, radius, shadows, typography } from "@/theme";

export const ui = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.ink,
  },
  heading: {
    ...typography.heading,
    color: colors.ink,
  },
  text: { ...typography.body, color: colors.ink },
  muted: { ...typography.label, fontWeight: "400", color: colors.muted },
  label: { ...typography.label, color: colors.ink },
  caption: { ...typography.caption, color: colors.muted },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  panel: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: radius.panel,
    borderCurve: "continuous",
    boxShadow: shadows.card,
    gap: 12,
  },
  content: {
    padding: layout.pagePadding,
    paddingBottom: 32,
    gap: 16,
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
  },
  divider: { height: 1, backgroundColor: colors.border },
});
