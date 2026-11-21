import { useState } from "react";
import { Image, View } from "react-native";
import { useApp } from "@/store/app-store";
import { AppIcon } from "@/components/ui";
import { colors, radius } from "@/theme";

export function FoodThumbnail({
  itemId,
  name,
  size = 64,
}: {
  itemId: string;
  name: string;
  size?: number;
}) {
  const { state } = useApp();
  const uri = state.menuItems.find((item) => item.id === itemId)?.imageUrl;
  const [failedUrl, setFailedUrl] = useState<string>();
  const frame = {
    width: size,
    height: size,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
  };
  if (!uri || failedUrl === uri)
    return (
      <View
        accessibilityLabel={name}
        style={[frame, { alignItems: "center", justifyContent: "center" }]}
      >
        <AppIcon
          name={
            itemId === "water"
              ? "water-outline"
              : itemId === "peach-tea"
                ? "cafe-outline"
                : "restaurant-outline"
          }
          size={size > 64 ? 40 : 25}
          color={colors.muted}
        />
      </View>
    );
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={`Ảnh món ${name}`}
      resizeMode="cover"
      onError={() => setFailedUrl(uri)}
      style={frame}
    />
  );
}
