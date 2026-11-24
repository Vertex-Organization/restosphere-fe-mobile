import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

/** Draws the QR on the device, so payment content never goes to a third-party service. */
export function PaymentQr({ value, size = 220 }: { value: string; size?: number }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mã QR thanh toán"
      style={{ alignSelf: "center", padding: 12, backgroundColor: "#fff", borderRadius: 12 }}
    >
      <QRCode value={value} size={size} backgroundColor="#fff" color="#000" />
    </View>
  );
}
