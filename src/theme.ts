// The supplied RestoSphere logo anchors red/gold accents on a light workspace.
export const colors = {
  primary: "#AE1824",
  primaryDark: "#28272A",
  primaryPressed: "#8C1520",
  primarySoft: "#FAEDEE",
  primaryBorder: "#EDCDD0",
  brandGold: "#EBA51E",
  ink: "#28272A",
  muted: "#6D6767",
  subtle: "#766E6D",
  border: "#E9E3DE",
  background: "#F7F5F1",
  surface: "#EFEAE3",
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
  inverseMuted: "#D4CDCA",
  inverseBorder: "#4B4545",
  overlay: "#28272A88",
} as const;

export const radius = { control: 12, panel: 20, badge: 6, full: 999 } as const;
export const typography = {
  title: { fontSize: 28, lineHeight: 36, fontWeight: "700", letterSpacing: -0.8 },
  heading: { fontSize: 19, lineHeight: 27, fontWeight: "600", letterSpacing: -0.4 },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  caption: { fontSize: 13, lineHeight: 19 },
  metric: { fontSize: 34, lineHeight: 42, fontWeight: "600", letterSpacing: -1 },
} as const;
// From wideMinWidth (desktop, landscape tablet) the workspace swaps the bottom
// tab bar for a left sidebar of sidebarWidth.
export const layout = {
  maxWidth: 1040,
  pagePadding: 20,
  sidebarWidth: 248,
  wideMinWidth: 1024,
} as const;
export const shadows = { card: "0 2px 8px rgba(41, 37, 30, 0.035)" } as const;
