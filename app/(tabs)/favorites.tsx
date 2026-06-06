import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { CATEGORIES, COLORS, FONTS, withAlpha } from "@/constants/theme";
import { getFactsByIds, type Fact } from "@/lib/facts";
import { getFavorites } from "@/lib/favorites";

export default function FavoritesScreen() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getFavorites().then((ids) => {
        if (active) {
          setFacts(getFactsByIds(ids));
          setLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const count = facts.length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        {count > 0 && (
          <Text style={styles.subtitle}>
            {count} {count === 1 ? "fact" : "facts"} saved
          </Text>
        )}
      </View>

      {count > 0 ? (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {facts.map((fact) => {
            const category = CATEGORIES[fact.category];
            return (
              <View key={fact.id} style={styles.card}>
                <Text style={[styles.cardCategory, { color: category.color }]}>
                  {category.label}
                </Text>
                <Text style={styles.cardFact}>{fact.text}</Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        loaded && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={28} color={COLORS.accent} />
            </View>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart on any fact to keep it here for later.
            </Text>
          </View>
        )
      )}
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
    paddingBottom: 4,
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
  list: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardFact: {
    fontFamily: FONTS.serifMedium,
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.ink,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: withAlpha(COLORS.accent, 0.1),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  emptyTitle: {
    fontFamily: FONTS.serifSemiBold,
    fontSize: 22,
    color: COLORS.ink,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.inkSoft,
    textAlign: "center",
  },
});
