// components/WOListItem.tsx
// Reusable card for a single Work Order row in any list screen.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const STATE_COLORS: Record<string, string> = {
  confirm_receipt: "#2563ab",
  part_sla:        "#dc2626",
  wo_sla:          "#16a34a",
  report_problem:  "#dc2626",
  wo_reschedule:   "#d97706",
  part_sla_ons:    "#dc2626",
  input_dc:        "#7c3aed",
  return_part:     "#16a34a",
  in_prepare:      "#0891b2",
};

const STATE_LABELS: Record<string, string> = {
  confirm_receipt: "Confirm AWB",
  part_sla:        "Part SLA Overdue",
  part_sla_ons:    "Part SLA (ONS)",
  wo_sla:          "In Repair",
  report_problem:  "SLA Breached",
  wo_reschedule:   "Reschedule",
  input_dc:        "Input DC#",
  return_part:     "Return Part",
  in_prepare:      "In Prepare",
};

interface Props {
  wo: {
    work_order_id: number;
    work_order_type?: string;
    work_order_status?: string;
    case_desc?: string;
    contact_name?: string;
    customer?: string;
    created_on?: string;
    committed_delivery_date?: string;
    followup_state?: string;
    // in-prepare specific
    part_product?: string;
    part_description?: string;
    part_order_date?: string;
    part_eta_wh?: string;
    no_part_lines?: number;
  };
  onPress: () => void;
}

export function WOListItem({ wo, onPress }: Props) {
  const state      = wo.followup_state || "in_prepare";
  const stateColor = STATE_COLORS[state] || "#6b7280";
  const stateLabel = STATE_LABELS[state] || state;
  const typeTag    = wo.work_order_type?.toUpperCase().includes("ONSITE") ? "ONS" : "CCI";
  const typeColor  = typeTag === "ONS" ? "#d97706" : "#2563ab";

  const created = wo.created_on ? wo.created_on.slice(0, 10) : "—";
  const eta     = wo.committed_delivery_date ? wo.committed_delivery_date.slice(0, 10) : "—";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Top row: WO number + type tag + state badge */}
      <View style={styles.topRow}>
        <Text style={styles.woNum}>#{wo.work_order_id}</Text>
        <View style={[styles.tag, { backgroundColor: typeColor + "22", borderColor: typeColor }]}>
          <Text style={[styles.tagText, { color: typeColor }]}>{typeTag}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: stateColor + "1a", borderColor: stateColor }]}>
          <Text style={[styles.badgeText, { color: stateColor }]}>{stateLabel}</Text>
        </View>
      </View>

      {/* Case description */}
      <Text style={styles.caseDesc} numberOfLines={2}>
        {wo.case_desc || "No description"}
      </Text>

      {/* Contact + customer */}
      {wo.contact_name ? (
        <Text style={styles.meta}>👤 {wo.contact_name}</Text>
      ) : null}

      {/* Part info (in-prepare) */}
      {wo.part_product || wo.part_description ? (
        <Text style={styles.meta} numberOfLines={1}>
          🔧 {wo.part_product} — {wo.part_description}
        </Text>
      ) : null}

      {/* Dates row */}
      <View style={styles.datesRow}>
        <Text style={styles.dateText}>Created: {created}</Text>
        <Text style={styles.dateText}>ETA: {eta}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#0f3460",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  woNum: { fontSize: 15, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#0f3460", flex: 1 },
  tag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
  caseDesc: { fontSize: 13, fontFamily: "IBMPlexSans_400Regular", color: "#374151", marginBottom: 4 },
  meta:     { fontSize: 12, fontFamily: "IBMPlexSans_400Regular", color: "#6b7280", marginBottom: 2 },
  datesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  dateText: { fontSize: 11, fontFamily: "IBMPlexSans_400Regular", color: "#9ca3af" },
});
