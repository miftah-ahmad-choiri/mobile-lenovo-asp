// components/WOScreen.tsx
// Shared screen layout used by all 5 WO list tabs.
// Accepts an endpoint and renders: search bar + FlatList + WODetailSheet.

import React, { useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useWOList } from "../hooks/useWOList";
import { WOListItem } from "./WOListItem";
import { WODetailSheet } from "./WODetailSheet";

interface Props {
  endpoint: string;
  extraParams?: Record<string, string>;
  emptyText?: string;
  accentColor?: string;
}

export function WOScreen({ endpoint, extraParams = {}, emptyText, accentColor }: Props) {
  const {
    rows, total, loading, refreshing, error, search,
    fetch, refresh, loadMore, onSearch,
    detailWO, detailParts, detailVisible, detailLoading,
    openDetail, closeDetail,
  } = useWOList(endpoint, extraParams);

  useEffect(() => {
    fetch(1, "");
  }, [endpoint, JSON.stringify(extraParams)]);

  const renderFooter = () => {
    if (!loading || rows.length === 0) return null;
    return <ActivityIndicator style={{ marginVertical: 16 }} color="#0f3460" />;
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search WO #, serial, contact..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={onSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Total count */}
      <Text style={styles.countText}>{total} work order{total !== 1 ? "s" : ""}</Text>

      {/* Error */}
      {error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetch(1, search)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Loading initial */}
      {loading && rows.length === 0 && !error ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0f3460" />
        </View>
      ) : null}

      {/* Empty */}
      {!loading && rows.length === 0 && !error ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>{emptyText || "No work orders found."}</Text>
        </View>
      ) : null}

      {/* List */}
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.work_order_id)}
        renderItem={({ item }) => (
          <WOListItem wo={item} onPress={() => openDetail(item.work_order_id)} accentColor={accentColor} />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0f3460" />
        }
        contentContainerStyle={rows.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
      />

      {/* Detail sheet */}
      <WODetailSheet
        visible={detailVisible}
        wo={detailWO}
        parts={detailParts}
        onClose={closeDetail}
      />

      {/* Detail loading overlay */}
      {detailLoading ? (
        <View style={styles.detailLoader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#d1d5db" },
  searchBox:   { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  searchInput: { backgroundColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, fontFamily: "IBMPlexSans_400Regular", color: "#111827" },
  countText:   { fontSize: 12, fontFamily: "IBMPlexSans_400Regular", color: "#6b7280", paddingHorizontal: 16, paddingVertical: 6 },
  centerBox:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText:   { color: "#dc2626", fontFamily: "IBMPlexSans_400Regular", textAlign: "center", marginBottom: 12 },
  retryBtn:    { backgroundColor: "#0f3460", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText:   { color: "#fff", fontWeight: "600", fontFamily: "IBMPlexSans_600SemiBold" },
  emptyText:   { color: "#6b7280", fontFamily: "IBMPlexSans_400Regular", textAlign: "center", fontSize: 15 },
  detailLoader: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});
