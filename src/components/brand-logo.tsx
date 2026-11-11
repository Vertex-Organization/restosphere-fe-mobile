import { Image, View } from "react-native";

// Keep the client's PNG unchanged. Frame the artwork's wide central band so its
// transparent outer canvas does not consume the mobile navigation bar.
export function BrandLogo({ width = 184 }: { width?: number }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="RestoSphere – Restaurant Management System"
      style={{ width, height: width * (330 / 1400), overflow: "hidden" }}>
      <Image source={require("../../assets/images/restosphere-logo.png")} accessible={false}
        style={{ position: "absolute", width: width * (1536 / 1400), height: width * (1024 / 1400), left: -width * (70 / 1400), top: -width * (305 / 1400) }} />
    </View>
  );
}
