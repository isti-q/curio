import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONTS } from "@/constants/theme";

export default function ArchiveScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Archive</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  title: {
    fontFamily: FONTS.serifSemiBold,
    fontSize: 26,
    color: COLORS.ink,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.inkFaint,
    marginTop: 2,
  },
});
