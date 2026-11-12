import { useState } from "react";
import { Image, View, type ImageSourcePropType } from "react-native";
import { AppIcon } from "@/components/ui";
import { colors, radius } from "@/theme";

// Bundled, licensed stand-ins. Source pages and replacement shot list: assets/images/menu/CREDITS.md.
const photos: Record<string, ImageSourcePropType> = {
  "seafood-rice": require("../../../../assets/images/menu/seafood-rice.jpg"),
  noodles: require("../../../../assets/images/menu/noodles.jpg"),
  "thai-pot": require("../../../../assets/images/menu/hotpot.jpg"),
  beef: require("../../../../assets/images/menu/beef.jpg"),
  chicken: require("../../../../assets/images/menu/chicken.jpg"),
  "old-pot": require("../../../../assets/images/menu/mushroom-hotpot.jpg"),
  "peach-tea": require("../../../../assets/images/menu/peach-tea.jpg"),
  "grilled-shrimp": require("../../../../assets/images/menu/shrimp.jpg"),
  "steamed-crab": require("../../../../assets/images/menu/crab.jpg"),
  "grilled-squid": require("../../../../assets/images/menu/squid.jpg"),
  "grilled-fish": require("../../../../assets/images/menu/fish.jpg"),
};

export function FoodThumbnail({ itemId, name, size = 64 }: { itemId: string; name: string; size?: number }) {
  const source = photos[itemId];
  const [failed, setFailed] = useState(false);
  const frame = { width: size, height: size, borderRadius: radius.control, backgroundColor: colors.surface };
  if (!source || failed) return (
    <View accessibilityLabel={name} style={[frame, { alignItems: "center", justifyContent: "center" }]}>
      <AppIcon name={itemId === "water" ? "water-outline" : itemId === "peach-tea" ? "cafe-outline" : "restaurant-outline"} size={size > 64 ? 40 : 25} color={colors.muted} />
    </View>
  );
  return <Image source={source} accessibilityLabel={`Ảnh món ${name}`} resizeMode="cover" onError={() => setFailed(true)} style={frame} />;
}
