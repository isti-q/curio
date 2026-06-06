import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { CATEGORIES, COLORS, FONTS, withAlpha } from "@/constants/theme";
import {
  factDate,
  formatDate,
  getFactById,
  googleSearchUrl,
} from "@/lib/facts";
import { useFactsVersion } from "@/lib/factsContext";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

export default function FactDetailScreen() {
  useFactsVersion();
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const fact = getFactById(id);

  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!fact) return;
    let active = true;
    isFavorite(fact.id).then((value) => {
      if (active) setSaved(value);
    });
    return () => {
      active = false;
    };
  }, [fact]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  if (!fact) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.ink} />
          </Pressable>
        </View>
        <View style={styles.missing}>
          <Text style={styles.missingText}>This fact could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = CATEGORIES[fact.category];
  const shownDate = date ? new Date(Number(date)) : factDate(fact.id);

  const onSearch = async () => {
    const url = googleSearchUrl(fact.searchKeywords);
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    }
  };

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 1800);
  };

  const onToggleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = await toggleFavorite(fact.id);
    setSaved(next);
    showToast(next ? "Saved to favorites" : "Removed from favorites");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.ink} />
          </Pressable>
          <Text style={styles.date}>{formatDate(shownDate)}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Category badge */}
          <View
            style={[
              styles.badge,
              { backgroundColor: withAlpha(category.color, 0.12) },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: category.color }]} />
            <Text style={[styles.badgeText, { color: category.color }]}>
              {category.label}
            </Text>
          </View>

          {/* Fact */}
          <Text style={styles.fact}>{fact.text}</Text>

          {/* Optional context paragraph */}
          {fact.detail ? <Text style={styles.context}>{fact.detail}</Text> : null}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Study further */}
          <Text style={styles.studyLabel}>Study further</Text>

          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={onSearch}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="search" size={18} color={COLORS.accent} />
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {fact.searchKeywords}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                Google search · opens in browser
              </Text>
            </View>
            <Ionicons
              name="arrow-up"
              size={16}
              color={COLORS.inkFaint}
              style={styles.cardArrow}
            />
          </Pressable>

          {/* Caption */}
          <View style={styles.caption}>
            <Ionicons
              name="information-circle-outline"
              size={13}
              color={COLORS.inkFaint}
            />
            <Text style={styles.captionText}>
              Searches the web — check the facts for yourself.
            </Text>
          </View>

          {/* Heart */}
          <Pressable
            onPress={onToggleSave}
            style={[styles.heartBtn, saved && styles.heartBtnSaved]}
            hitSlop={8}
          >
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={20}
              color={saved ? COLORS.accent : COLORS.inkSoft}
            />
          </Pressable>
        </ScrollView>

        {toast && (
          <Animated.View
            style={[
              styles.toast,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="checkmark" size={16} color={COLORS.white} />
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.inkFaint,
    paddingRight: 8,
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 36,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  fact: {
    fontFamily: FONTS.serifMedium,
    fontSize: 25,
    lineHeight: 33,
    color: COLORS.ink,
    marginTop: 18,
  },
  context: {
    fontFamily: FONTS.serifQuote,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.inkSoft,
    marginTop: 16,
  },
  divider: {
    width: 38,
    height: 2,
    backgroundColor: COLORS.line,
    marginVertical: 20,
  },
  studyLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: COLORS.inkFaint,
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.iconBg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.ink,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.inkFaint,
    marginTop: 1,
  },
  cardArrow: {
    transform: [{ rotate: "45deg" }],
  },
  caption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 9,
  },
  captionText: {
    fontSize: 10.5,
    color: COLORS.inkFaint,
  },
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  heartBtnSaved: {
    borderColor: COLORS.accent,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  missingText: {
    fontSize: 15,
    color: COLORS.inkSoft,
  },
  toast: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.ink,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  toastText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
