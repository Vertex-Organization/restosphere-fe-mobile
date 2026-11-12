// Sea-glass surfaces and deep ocean ink keep the seafood workspace calm in a busy shift.
// The supplied logo keeps its original colours; operational states have their own tones.
export const colors = {
  primary: "#14665F",
  primaryDark: "#163B43",
  primaryPressed: "#0E514B",
  primarySoft: "#E4F1ED",
  primaryBorder: "#BEDBD2",
  brandGold: "#EBA51E",
  ink: "#16323B",
  muted: "#617479",
  subtle: "#697C81",
  border: "#DFE8E5",
  background: "#F3F6F5",
  surface: "#EAF0EE",
  white: "#FFFFFF",
  danger: "#B03E38",
  dangerSoft: "#FBEDEB",
  warning: "#805B14",
  warningSoft: "#FFF3D9",
  success: "#2D6B50",
  successSoft: "#EAF3ED",
  successBorder: "#CDDFD3",
  info: "#37617D",
  infoSoft: "#EBF1F6",
  infoBorder: "#CEDDE9",
  inverseMuted: "#CDDDDA",
  inverseBorder: "#3E5960",
  overlay: "#16323B88",
} as const;

export const radius = { control: 10, panel: 14, badge: 6, full: 999 } as const;
export const spacing = { xs: 4, sm: 8, compact: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;
export const typography = {
  title: { fontSize: 26, lineHeight: 34, fontWeight: "700", letterSpacing: -0.6 },
  heading: { fontSize: 19, lineHeight: 27, fontWeight: "600", letterSpacing: -0.4 },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  caption: { fontSize: 13, lineHeight: 19 },
  metric: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.7 },
} as const;
// From wideMinWidth (desktop, landscape tablet) the workspace swaps the bottom
// tab bar for a left sidebar of sidebarWidth.
export const layout = {
  maxWidth: 1040,
  pagePadding: 20,
  sidebarWidth: 248,
  wideMinWidth: 1024,
} as const;
export const shadows = { card: "0 1px 3px rgba(22, 50, 59, 0.035)" } as const;
