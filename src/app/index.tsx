import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={[styles.backgroundCircle, styles.topCircle]} />
      <View pointerEvents="none" style={[styles.backgroundCircle, styles.bottomCircle]} />

      <View style={styles.content}>
        <View accessible={false} style={styles.iconHalo}>
          <View style={styles.iconCircle}>
            <View style={styles.checkmark} />
          </View>
        </View>
        <Text
          accessibilityRole="header"
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          numberOfLines={1}
          style={styles.message}>
          Giao diện mobile đã khởi tạo thành công
        </Text>
        <View style={styles.accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F8F7F2',
    overflow: 'hidden',
  },
  backgroundCircle: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#EDF1E7',
  },
  topCircle: { top: -180, right: -140 },
  bottomCircle: { bottom: -200, left: -160 },
  content: { width: '100%', maxWidth: 720, alignItems: 'center', gap: 26 },
  iconHalo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EAF0E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#203E35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 15,
    height: 27,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ translateY: -3 }, { rotate: '45deg' }],
  },
  message: {
    width: '100%',
    color: '#203E35',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.4,
    paddingVertical: 4,
  },
  accent: { width: 36, height: 3, borderRadius: 2, backgroundColor: '#A2B391' },
});
