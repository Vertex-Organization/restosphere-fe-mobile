import { Link } from "expo-router";
import { Text } from "react-native";
import { Screen } from "@/components/layout/screen";
import { ui } from "@/components/ui";
export default function NotFound() {
  return (
    <Screen login>
      <Text style={ui.title}>Không tìm thấy màn hình</Text>
      <Text style={ui.text}>
        Đường dẫn không tồn tại hoặc không thuộc khu vực làm việc của bạn.
      </Text>
      <Link href="/" style={{ ...ui.text, padding: 16 }}>
        Về màn hình chính
      </Link>
    </Screen>
  );
}
