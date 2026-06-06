import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { CATEGORIES, COLORS, FONTS, withAlpha } from "@/constants/theme";
import { getArchiveFacts } from "@/lib/facts";
import { useFactsVersion } from "@/lib/factsContext";

export default function ArchiveScreen() {
  useFactsVersion();
  const entries = getArchiveFacts();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Archive</Text>
        <Text style={styles.subtitle}>Everything from the last 90 days</Text>
      </View>

      {entries.length > 0 ? (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.fact.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const category = CATEGORIES[item.fact.category];
            const month = item.date
              .toLocaleDateString("en-US", { month: "short" })
              .toUpperCase();
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() =>
                  router.push({
                    pathname: "/fact/[id]",
                    params: {
                      id: item.fact.id,
                      date: String(item.date.getTime()),
                    },
                  })
                }
              >
                <View style={styles.dateBlock}>
                  <Text style={styles.dateDay}>{item.date.getDate()}</Text>
                  <Text style={styles.dateMonth}>{month}</Text>
                </View>

                <View style={styles.rowMeta}>
                  <Text style={[styles.rowCategory, { color: category.color }]}>
                    {category.label}
                  </Text>
                  <Text style={styles.rowFact} numberOfLines={2}>
                    {item.fact.text}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.inkFaint}
                  style={styles.chevron}
                />
              </Pressable>
            );
          }}
        />
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={28} color={COLORS.accent} />
          </View>
          <Text style={styles.emptyText}>
            Your archive starts filling up after today.
          </Text>
        </View>
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
    paddingTop: 8,
    paddingBottom: 28,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  rowPressed: {
    opacity: 0.6,
  },
  dateBlock: {
    width: 44,
    alignItems: "center",
  },
  dateDay: {
    fontFamily: FONTS.serifSemiBold,
    fontSize: 26,
    lineHeight: 30,
    color: COLORS.ink,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: COLORS.inkFaint,
    marginTop: 1,
  },
  rowMeta: {
    flex: 1,
    minWidth: 0,
  },
  rowCategory: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  rowFact: {
    fontFamily: FONTS.serifQuote,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.ink,
  },
  chevron: {
    marginLeft: 2,
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
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.inkFaint,
    textAlign: "center",
  },
});
