import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { COLORS, FONTS } from "@/constants/theme";
import { getTodaysQuote } from "@/lib/quotes";

const SPLASH_DURATION = 5000;

export default function SplashScreen() {
  const quote = getTodaysQuote();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      router.replace("/(tabs)/today");
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, [progress]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.wordmark}>✦ CURIO</Text>

      <View style={styles.center}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quote}>{quote.text}</Text>
        <Text style={styles.author}>— {quote.author}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: fillWidth }]} />
        </View>
        <Text style={styles.preparing}>Preparing today&rsquo;s curiosity…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 36,
  },
  wordmark: {
    fontFamily: FONTS.serifSemiBold,
    fontSize: 13,
    letterSpacing: 5,
    color: COLORS.accent,
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  quoteMark: {
    fontFamily: FONTS.serifSemiBold,
    fontSize: 40,
    lineHeight: 40,
    color: COLORS.accent,
    marginBottom: 18,
  },
  quote: {
    fontFamily: FONTS.serifQuote,
    fontSize: 21,
    lineHeight: 30,
    color: COLORS.ink,
    textAlign: "center",
  },
  author: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: COLORS.inkFaint,
    marginTop: 22,
  },
  footer: {
    alignItems: "center",
  },
  track: {
    width: "100%",
    height: 3,
    borderRadius: 999,
    backgroundColor: COLORS.line,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  preparing: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.inkFaint,
    marginTop: 14,
  },
});
