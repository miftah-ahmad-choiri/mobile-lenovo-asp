// components/WODetailSheet.tsx
// Bottom sheet showing full WO details when a list row is tapped.
// Pure React Native Modal — no extra library needed.

import React, { useState } from "react";
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

// Returns the left-border accent colour for part cards
function partBorderColor(status: string): string {
  const { text } = statusPillColors(status);
  return text;
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
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-end",
  },
  text: { fontSize: 11, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", letterSpacing: 0.3 },
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
  company_name?: string;
  address?: string;
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
  onInputDC?: (part: Part) => void;
  onConfirmAWB?: (part: Part) => void;
  onSchedule?: (wo: WO) => void;
  onEscalate?: (wo: WO) => void;
}

function Row({
  label,
  value,
  phone,
  last,
}: {
  label: string;
  value?: string | number | null;
  phone?: boolean;
  last?: boolean;
}) {
  if (!value && value !== 0) return null;
  const strVal = String(value);
  return (
    <View style={[styles.row, last && styles.rowLast]}>
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

function Section({
  title,
  accentColor = "#0f3460",
  children,
}: {
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionAccentBar, { backgroundColor: accentColor }]} />
        <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── PartItem — measures its own height so the action button is always square ──
function PartItem({
  p,
  onInputDC,
  onConfirmAWB,
}: {
  p: Part;
  onInputDC?: (part: Part) => void;
  onConfirmAWB?: (part: Part) => void;
}) {
  const isCancelled = (p.wo_product_status || "").toLowerCase().includes("cancel");
  const accentBorder = p.wo_product_status ? partBorderColor(p.wo_product_status) : "#d1d5db";
  const hasAction = !isCancelled && (onInputDC || onConfirmAWB);

  const [btnSize, setBtnSize] = useState<number>(0);

  return (
    <View style={styles.partRow}>
      {/* Card — reports its height so button can match */}
      <View
        style={[
          styles.partCard,
          { borderLeftColor: accentBorder },
          isCancelled && styles.partCardCancelled,
        ]}
        onLayout={hasAction ? (e) => setBtnSize(e.nativeEvent.layout.height) : undefined}
      >
        <View style={styles.partHeaderRow}>
          <Text style={[styles.partTitle, isCancelled && styles.partTitleCancelled]}>
            {p.soid}
          </Text>
          {p.wo_product_status ? <StatusPill value={p.wo_product_status} /> : null}
        </View>
        <Text style={[styles.partSoid, isCancelled && styles.cancelledText]}>
          {p.product ? `Product ID: ${p.product}` : "—"}
        </Text>
        {p.description ? (
          <Text style={[styles.partDesc, isCancelled && styles.partDescCancelled]} numberOfLines={1} ellipsizeMode="tail">
            {p.description}
          </Text>
        ) : null}
        {!isCancelled && (
          <View style={styles.partMeta}>
            <Row label="AWB"      value={p.awb} />
            <Row label="POD Date" value={p.ship_pou_pod_time?.slice(0, 10)} />
            <Row label="DC#"      value={p.dc_number} />
            <Row label="Return"   value={p.return_flag} last />
          </View>
        )}
      </View>

      {/* Action button — square: width = measured card height */}
      {!isCancelled && onInputDC ? (
        <TouchableOpacity
          style={[styles.inputDCBtn, btnSize > 0 && { width: btnSize }]}
          onPress={() => onInputDC(p)}
          activeOpacity={0.8}
        >
          <Text style={styles.inputDCBtnText}>Input DC</Text>
          <Text style={styles.actionBtnChevron}>⏷</Text>
        </TouchableOpacity>
      ) : null}
      {!isCancelled && onConfirmAWB ? (
        <TouchableOpacity
          style={[styles.confirmAWBBtn, btnSize > 0 && { width: btnSize }]}
          onPress={() => onConfirmAWB(p)}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmAWBBtnText}>Confirm{"\n"}AWB</Text>
          <Text style={styles.actionBtnChevron}>⏷</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}


export function WODetailSheet({ visible, wo, parts, onClose, onInputDC, onConfirmAWB, onSchedule, onEscalate }: Props) {
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
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <Text style={styles.woId}>WO #{wo.work_order_id}</Text>
              {wo.work_order_type ? (
                <Text style={styles.woSubtitle}>{wo.work_order_type}</Text>
              ) : null}
            </View>
            <View style={styles.sheetHeaderRight}>
              {wo.work_order_status ? <StatusPill value={wo.work_order_status} /> : null}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Work Order ── */}
            <Section title="Work Order" accentColor="#0f3460">
              <Row label="Case"        value={wo.case_desc} />
              <Row label="Serial No."  value={wo.serial_number} />
              <Row label="Product"     value={wo.product_description} />
              <Row label="MTM"         value={wo.product_id_mtm} last />
            </Section>

            {/* ── Schedule ── */}
            <Section title="Schedule" accentColor="#0d9488">
              <Row label="Created"         value={wo.created_on?.slice(0, 10)} />
              <Row label="Committed ETA"   value={wo.committed_delivery_date?.slice(0, 10)} />
              <Row label="Onsite Date"     value={wo.actual_committed_onsite_date?.slice(0, 10)} />
              <Row label="Completion Date" value={wo.completion_date?.slice(0, 10)} />
              <Row label="Closing Date"    value={wo.closing_date?.slice(0, 10)} last />
            </Section>

            {/* ── Customer ── */}
            <Section title="Customer" accentColor="#7c3aed">
              <Row label="Contact" value={wo.contact_name} />
              <Row
                label="Address"
                value={(() => {
                  const parts: string[] = [];
                  if (wo.company_name?.trim()) parts.push(wo.company_name.trim());
                  if (wo.address?.trim())      parts.push(wo.address.trim().replace(/[\r\n]+/g, " "));
                  return parts.length ? parts.join(", ") : (wo.city ?? null);
                })()}
              />
              <Row label="Phone"   value={wo.mobile_phone} phone />
              <Row label="Email"   value={wo.primary_email} last />
            </Section>

            {/* ── Parts ── */}
            {parts.length > 0 && (
              <Section title={`Parts (${parts.length})`} accentColor="#b45309">
                {[...parts]
                  .sort((a, b) => {
                    const aCancelled = (a.wo_product_status || "").toLowerCase().includes("cancel");
                    const bCancelled = (b.wo_product_status || "").toLowerCase().includes("cancel");
                    return (aCancelled ? 1 : 0) - (bCancelled ? 1 : 0);
                  })
                  .map((p, i) => (
                    <PartItem
                      key={p.soid ?? i}
                      p={p}
                      onInputDC={onInputDC}
                      onConfirmAWB={onConfirmAWB}
                    />
                  ))}
              </Section>
            )}
          </ScrollView>

          {/* ── ONS Action Footer ── */}
          {(onSchedule || onEscalate) ? (
            <View style={styles.actionFooter}>
              {onSchedule ? (
                <TouchableOpacity
                  style={styles.scheduleBtn}
                  onPress={() => onSchedule(wo)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scheduleBtnText}>🗓️  Jadwalkan Onsite</Text>
                </TouchableOpacity>
              ) : null}
              {onEscalate ? (
                <TouchableOpacity
                  style={styles.escalateBtn}
                  onPress={() => onEscalate(wo)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.escalateBtnText}>✆</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)" },

  sheet: {
    backgroundColor: "#f3f4f6",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.88,
    overflow: "hidden",
  },

  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#f3f4f6",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9ca3af",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#0f3460",
    gap: 10,
  },
  sheetHeaderLeft: { flex: 1 },
  sheetHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  woId: {
    fontSize: 19,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#ffffff",
  },
  woSubtitle: {
    fontSize: 12,
    fontFamily: "IBMPlexSans_400Regular",
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  closeBtn:     { padding: 4 },
  closeBtnText: { fontSize: 18, fontFamily: "IBMPlexSans_400Regular", color: "rgba(255,255,255,0.7)" },

  scroll:        { flexGrow: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 32 },

  // ── Section ──
  section: {
    backgroundColor: "#ffffff",
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
    // subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  sectionAccentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ── Row ──
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "IBMPlexSans_400Regular",
    color: "#6b7280",
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    fontFamily: "IBMPlexSans_500Medium",
    flex: 2,
    textAlign: "right",
  },
  phoneValue: { color: "#2563ab", textDecorationLine: "underline" },

  // ── Part card ──
  partCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: "#e5e7eb",
  },
  partCardCancelled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
    opacity: 0.65,
  },
  partRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 10,
    gap: 8,
  },
  partHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  partTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#0f3460",
  },
  partTitleCancelled: { color: "#9ca3af" },
  partSoid: {
    fontSize: 11,
    fontFamily: "IBMPlexSans_400Regular",
    color: "#9ca3af",
    marginTop: 1,
  },
  partDesc: {
    fontSize: 12,
    fontFamily: "IBMPlexSans_400Regular",
    color: "#6b7280",
    marginBottom: 6,
    lineHeight: 17,
  },
  partDescCancelled: { color: "#9ca3af" },
  partMeta: { marginTop: 6 },
  cancelledText: { color: "#9ca3af" },

  // ── ONS action footer ──
  actionFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  scheduleBtn: {
    flex: 1,
    backgroundColor: "#0d9488",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  escalateBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  escalateBtnText: {
    fontSize: 24,
    color: "#ffffff",
  },

  // ── Action buttons (compact square, right column) ──
  inputDCBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 8,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  inputDCBtnText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#ffffff",
    letterSpacing: 0.3,
    textAlign: "center",
    lineHeight: 15,
  },
  confirmAWBBtn: {
    backgroundColor: "#0891b2",
    borderRadius: 8,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmAWBBtnText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "IBMPlexSans_700Bold",
    color: "#ffffff",
    letterSpacing: 0.3,
    textAlign: "center",
    lineHeight: 15,
  },
  actionBtnChevron: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 14,
    marginTop: 4,
  },
});
