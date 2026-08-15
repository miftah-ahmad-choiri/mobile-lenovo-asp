// components/WODetailSheet.tsx
// Bottom sheet showing full WO details when a list row is tapped.
// Pure React Native Modal — no extra library needed.

import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";

// ── Status pill colour map ────────────────────────────────────────────────────
function statusPillColors(status: string): { bg: string; text: string; border: string } {
  const s = status.toLowerCase();
  if (s.includes("cancel"))                             return { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" };
  if (s.includes("transit") || s.includes("shipped"))  return { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" };
  if (s.includes("delivered") || s.includes("complet") || s.includes("closed") || s.includes("pickup"))
                                                        return { bg: "#dcfce7", text: "#15803d", border: "#86efac" };
  if (s.includes("hold") || s.includes("part hold"))   return { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" };
  if (s.includes("open") || s.includes("created") || s.includes("released"))
                                                        return { bg: "#e0e7ff", text: "#4338ca", border: "#a5b4fc" };
  if (s.includes("reschedule"))                         return { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" };
  if (s.includes("repair"))                             return { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" };
  return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
}

function StatusPill({ value }: { value: string }) {
  const { bg, text, border } = statusPillColors(value);
  return (
    <View style={[pillStyles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[pillStyles.text, { color: text }]}>{value}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-end",
  },
  text: { fontSize: 12, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold" },
});

const SCREEN_H = Dimensions.get("window").height;

interface Part {
  soid: number;
  product?: string;
  description?: string;
  order_date?: string;
  delivery_date?: string;
  wo_product_status?: string;
  awb?: string;
  return_flag?: string;
  dc_number?: string;
  ship_pou_pod_time?: string;
}

interface WO {
  work_order_id: number;
  serial_number?: string;
  work_order_type?: string;
  work_order_status?: string;
  case_desc?: string;
  case_status?: string;
  contact_name?: string;
  customer?: string;
  created_on?: string;
  committed_delivery_date?: string;
  actual_committed_onsite_date?: string;
  product_description?: string;
  product_id_mtm?: string;
  city?: string;
  mobile_phone?: string;
  primary_email?: string;
  completion_date?: string;
  closing_date?: string;
  followup_state?: string;
}

interface Props {
  visible: boolean;
  wo: WO | null;
  parts: Part[];
  onClose: () => void;
}

function Row({ label, value, phone }: { label: string; value?: string | number | null; phone?: boolean }) {
  if (!value && value !== 0) return null;
  const strVal = String(value);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {phone ? (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${strVal}`)} activeOpacity={0.7}>
          <Text style={[styles.rowValue, styles.phoneValue]}>{strVal}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.rowValue}>{strVal}</Text>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function WODetailSheet({ visible, wo, parts, onClose }: Props) {
  if (!wo) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.woId}>WO #{wo.work_order_id}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Section title="Work Order">
              {wo.work_order_status ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Status</Text>
                  <StatusPill value={wo.work_order_status} />
                </View>
              ) : null}
              <Row label="Type"        value={wo.work_order_type} />
              <Row label="Case"        value={wo.case_desc} />
              <Row label="Case Status" value={wo.case_status} />
              <Row label="Serial No."  value={wo.serial_number} />
              <Row label="Product"     value={wo.product_description} />
              <Row label="MTM"         value={wo.product_id_mtm} />
            </Section>

            <Section title="Schedule">
              <Row label="Created"          value={wo.created_on?.slice(0, 10)} />
              <Row label="Committed ETA"    value={wo.committed_delivery_date?.slice(0, 10)} />
              <Row label="Onsite Date"      value={wo.actual_committed_onsite_date?.slice(0, 10)} />
              <Row label="Completion Date"  value={wo.completion_date?.slice(0, 10)} />
              <Row label="Closing Date"     value={wo.closing_date?.slice(0, 10)} />
            </Section>

            <Section title="Customer">
              <Row label="Contact"  value={wo.contact_name} />
              <Row label="City"     value={wo.city} />
              <Row label="Phone"    value={wo.mobile_phone} phone />
              <Row label="Email"    value={wo.primary_email} />
            </Section>

            {parts.length > 0 && (
              <Section title={`Parts (${parts.length})`}>
                {[...parts]
                  .sort((a, b) => {
                    const aCancelled = (a.wo_product_status || "").toLowerCase().includes("cancel");
                    const bCancelled = (b.wo_product_status || "").toLowerCase().includes("cancel");
                    return (aCancelled ? 1 : 0) - (bCancelled ? 1 : 0);
                  })
                  .map((p, i) => {
                    const isCancelled = (p.wo_product_status || "").toLowerCase().includes("cancel");
                    return (
                      <View key={p.soid ?? i} style={[styles.partCard, isCancelled && styles.partCardCancelled]}>
                        <Text style={[styles.partTitle, isCancelled && styles.partTitleCancelled]}>
                          SOID {p.soid} — {p.product || "—"}
                        </Text>
                        <Text style={[styles.partDesc, isCancelled && styles.partDescCancelled]}>{p.description || "—"}</Text>
                        {p.wo_product_status ? (
                          <View style={styles.row}>
                            <Text style={[styles.rowLabel, isCancelled && styles.cancelledText]}>Status</Text>
                            <StatusPill value={p.wo_product_status} />
                          </View>
                        ) : null}
                        {!isCancelled && <Row label="AWB"      value={p.awb} />}
                        {!isCancelled && <Row label="POD Date" value={p.ship_pou_pod_time?.slice(0, 10)} />}
                        {!isCancelled && <Row label="DC#"      value={p.dc_number} />}
                        {!isCancelled && <Row label="Return"   value={p.return_flag} />}
                      </View>
                    );
                  })}
              </Section>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#d1d5db",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_H * 0.88,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  woId:       { fontSize: 18, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#0f3460", flex: 1 },
  closeBtn:   { padding: 6 },
  closeBtnText: { fontSize: 18, fontFamily: "IBMPlexSans_400Regular", color: "#6b7280" },
  scroll:     { flexGrow: 0 },
  scrollContent: { paddingBottom: 16 },
  section:    { backgroundColor: "#fff", marginTop: 10, paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  rowLabel:   { fontSize: 13, fontFamily: "IBMPlexSans_400Regular", color: "#6b7280", flex: 1 },
  rowValue:   { fontSize: 13, color: "#111827", fontWeight: "500", fontFamily: "IBMPlexSans_500Medium", flex: 2, textAlign: "right" },
  phoneValue: { color: "#2563ab", textDecorationLine: "underline" },
  partCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  partCardCancelled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
    opacity: 0.7,
  },
  partTitle:          { fontSize: 13, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#0f3460", marginBottom: 2 },
  partTitleCancelled: { color: "#9ca3af" },
  partDesc:           { fontSize: 12, fontFamily: "IBMPlexSans_400Regular", color: "#6b7280", marginBottom: 6 },
  partDescCancelled:  { color: "#9ca3af" },
  cancelledText:      { color: "#9ca3af" },
});
