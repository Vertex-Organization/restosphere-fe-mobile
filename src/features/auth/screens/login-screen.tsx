import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BrandLogo } from "@/components/brand-logo";
import { Screen } from "@/components/layout/screen";
import { Button, Field, IconButton, Message, ui } from "@/components/ui";
import { useApp } from "@/store/app-store";
import { colors, radius } from "@/theme";

export default function LoginScreen() {
  const { signIn } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  async function submit() {
    if (busy) return;
    setSubmitted(true);
    if (!username.trim() || !password) return setError("Nhập tài khoản và mật khẩu để tiếp tục.");
    setBusy(true);
    setError("");
    try { await signIn(username, password); setPassword(""); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <Screen login>
      <View style={styles.page}>
        <View style={styles.brand}>
          <BrandLogo width={260} />
        </View>
        <View style={styles.intro}>
          <View style={styles.role}><View style={styles.dot} /><Text style={[ui.label, { color: colors.primary }]}>RestoSphere Staff</Text></View>
          <Text accessibilityRole="header" style={styles.title}>Sẵn sàng cho{"\n"}một ca làm việc.</Text>
          <Text style={[ui.text, { color: colors.muted }]}>Đón khách, gọi món và theo dõi phục vụ theo vai trò của bạn.</Text>
        </View>
        <View style={[ui.panel, styles.form]}>
          <View style={{ gap: 4 }}>
            <Text style={ui.heading}>Đăng nhập nhân viên</Text>
            <Text style={ui.muted}>Sử dụng tài khoản được cấp để tiếp tục.</Text>
          </View>
          <Field label="Email" placeholder="Nhập email được cấp" icon="person-outline" value={username} onChangeText={setUsername}
            autoCapitalize="none" autoCorrect={false} autoComplete="username"
            error={submitted && !username.trim() ? "Vui lòng nhập tài khoản." : undefined} />
          <Field label="Mật khẩu" placeholder="Nhập mật khẩu" icon="lock-closed-outline" value={password} onChangeText={setPassword}
            secureTextEntry={!visible} autoComplete="current-password" onSubmitEditing={submit}
            error={submitted && !password ? "Vui lòng nhập mật khẩu." : undefined}
            trailing={<IconButton icon={visible ? "eye-off-outline" : "eye-outline"} label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onPress={() => setVisible(!visible)} />} />
          {!!error && <Message>{error}</Message>}
          <Button title={busy ? "Đang đăng nhập…" : "Đăng nhập"} icon="arrow-forward-outline" disabled={busy} onPress={submit} />
          {__DEV__ && <View style={{ gap: 12 }}>
            <Text style={ui.muted}>Tài khoản demo · Mật khẩu: 123456</Text>
            {([['receptionist', 'Lễ tân'], ['waiter', 'Phục vụ']] as const).map(([name, label]) => (
              <View key={name} style={{ gap: 4 }}>
                <Button title={`Điền tài khoản ${label}`} disabled={busy} onPress={() => {
                  setUsername(`${name}@restosphere.test`); setPassword("123456"); setError(""); setSubmitted(false);
                }} />
                <Text style={ui.muted}>{name}@restosphere.test</Text>
              </View>
            ))}
          </View>}
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  page: { width: "100%", maxWidth: 460, alignSelf: "center", paddingTop: 20, paddingBottom: 16, gap: 28 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  intro: { gap: 14 },
  role: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  title: { fontSize: 34, lineHeight: 43, fontWeight: "600", letterSpacing: -1.2, color: colors.ink },
  form: { padding: 24, gap: 20 },
});
