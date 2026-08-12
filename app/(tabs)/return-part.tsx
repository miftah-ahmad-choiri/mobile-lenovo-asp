// app/(tabs)/return-part.tsx
import { View, Text, StyleSheet } from "react-native";
import { WOScreen } from "../../components/WOScreen";
import { useStats } from "../../hooks/useStats";

function ReturnPartBanner() {
  const { stats } = useStats();
  const count = stats?.return_part_total ?? 0;
  if (!count) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>
        {count} work order{count !== 1 ? "s" : ""} awaiting part return
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#7c3aed1a",
    borderBottomWidth: 1,
    borderBottomColor: "#7c3aed33",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7c3aed",
  },
});

export default function ReturnPartScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ReturnPartBanner />
      <WOScreen
        endpoint="/api/v1/mobile/return-part"
        emptyText="No Return Part work orders for your ASP."
      />
    </View>
  );
}
