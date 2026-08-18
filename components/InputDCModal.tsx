// components/InputDCModal.tsx
// Modal form for recording a DC Number from Resolv — mirrors the web dashboard form.
// Shown when the user taps "Input DC" on a part in the Return Part page.

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import api from "../services/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SameAspWO {
  work_order_id: number;
  work_order_status?: string;
  work_order_type?: string;
  completion_date?: string;
  soid?: number | string;
  description?: string;
  return_status?: string;
}

interface SameAspGroup {
  work_order_id: number;
  work_order_status?: string;
  work_order_type?: string;
  completion_date?: string;
  parts: { soid: string; description: string; return_status: string }[];
}

interface Props {
  visible: boolean;
  woId: number | null;
  woType?: string;
  woStatus?: string;
  aspName?: string;
  partSoid?: number | string;
  partDescription?: string;
  onClose: () => void;
  onSuccess: (dcNumber: string, updatedWoIds: number[]) => void;
}

// ── Checkbox key: "woId:soid" ─────────────────────────────────────────────────
function partKey(woId: number | string, soid: string) {
  return `${woId}:${soid}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InputDCModal({
  visible,
  woId,
  woType,
  woStatus,
  aspName,
  partSoid,
  partDescription,
  onClose,
  onSuccess,
}: Props) {
  const [dcNumber, setDcNumber]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sameAspWOs, setSameAspWOs] = useState<SameAspGroup[]>([]);
  const [loadingWOs, setLoadingWOs] = useState(false);
  // checked state: keyed by "woId:soid"
  const [checked, setChecked]       = useState<Record<string, boolean>>({});

  // Reset and load when modal opens
  useEffect(() => {
    if (!visible || !woId) return;
    setDcNumber("");
    setSameAspWOs([]);
    setChecked({});
    loadSameAspWOs();
  }, [visible, woId]);

  async function loadSameAspWOs() {
    if (!woId) return;
    setLoadingWOs(true);
    try {
      const res = await api.get(`/api/v1/mobile/wo/${woId}/return-same-asp`);
      const rows: SameAspWO[] = res.data.rows || [];
      const currentWoId       = String(res.data.current_wo_id);

      // Group rows by work_order_id
      const byWo: Record<string, SameAspGroup> = {};
      rows.forEach((r) => {
        const id = String(r.work_order_id);
        if (!byWo[id]) {
          byWo[id] = {
            work_order_id:     r.work_order_id,
            work_order_status: r.work_order_status,
            work_order_type:   r.work_order_type,
            completion_date:   r.completion_date,
            parts: [],
          };
        }
        if (r.soid != null) {
          byWo[id].parts.push({
            soid:          String(r.soid),
            description:   r.description || "",
            return_status: r.return_status || "",
          });
        }
      });

      // Sort: current WO first, then by completion_date desc
      const groups = Object.values(byWo).sort((a, b) => {
        if (String(a.work_order_id) === currentWoId) return -1;
        if (String(b.work_order_id) === currentWoId) return 1;
        return (b.completion_date || "") > (a.completion_date || "") ? 1 : -1;
      });

      setSameAspWOs(groups);

      // Auto-check all parts of the current WO
      const initChecked: Record<string, boolean> = {};
      groups.forEach((g) => {
        const isCurrent = String(g.work_order_id) === currentWoId;
        g.parts.forEach((p) => {
          initChecked[partKey(g.work_order_id, p.soid)] = isCurrent;
        });
      });
      setChecked(initChecked);
    } catch {
      // silently hide section if fails
    } finally {
      setLoadingWOs(false);
    }
  }

  // All part keys across all groups
  function allPartKeys(): string[] {
    const keys: string[] = [];
    sameAspWOs.forEach((g) =>
      g.parts.forEach((p) => keys.push(partKey(g.work_order_id, p.soid)))
    );
    return keys;
  }

  function togglePart(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function selectAll() {
    const keys       = allPartKeys();
    const allChecked = keys.length > 0 && keys.every((k) => checked[k]);
    const next: Record<string, boolean> = {};
    keys.forEach((k) => { next[k] = !allChecked; });
    setChecked(next);
  }

  async function handleSubmit() {
    const dc = dcNumber.trim();
    if (!dc) {
      Alert.alert("Required", "Please enter the DC Number.");
      return;
    }
    if (!woId) return;

    // Collect unique WO IDs from checked part keys; fall back to current WO
    const checkedKeys = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const woIdSet = new Set(checkedKeys.map((k) => Number(k.split(":")[0])));
    const woIds   = woIdSet.size > 0 ? [...woIdSet] : [woId];

    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/mobile/wo/${woId}/input-dc`, {
        dc_number: dc,
        wo_ids:    woIds,
      });
      onSuccess(dc, woIds);
      Alert.alert(
        "DC Number Saved",
        `DC ${dc} recorded for ${res.data.updated_wos} WO${res.data.updated_wos !== 1 ? "s" : ""}.`
      );
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.error || "Failed to save DC Number.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!visible) return null;

  const keys       = allPartKeys();
  const allSelected = keys.length > 0 && keys.every((k) => checked[k]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.sheet}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>🗂</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Input DC Number</Text>
              <Text style={styles.headerSub}>Return Part — record the DC number from Resolv</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

            {/* ── WO Context Strip ── */}
            <View style={styles.woStrip}>
              <View style={styles.woStripTop}>
                <Text style={styles.woStripLabel}>WO#</Text>
                <Text style={styles.woStripNum}>{woId}</Text>
                {woStatus ? <View style={styles.woStripBadge}><Text style={styles.woStripBadgeText}>{woStatus}</Text></View> : null}
              </View>
              {(woType || aspName) ? (
                <View style={styles.woStripMeta}>
                  {woType ? <Text style={styles.woTypePill}>{woType}</Text> : null}
                  {aspName ? <Text style={styles.woStripAsp}>{aspName}</Text> : null}
                </View>
              ) : null}
              {(partSoid || partDescription) ? (
                <View style={styles.partStrip}>
                  {partSoid ? <Text style={styles.partStripSoid}>{String(partSoid)}</Text> : null}
                  {partDescription ? <Text style={styles.partStripDesc} numberOfLines={2}>{partDescription}</Text> : null}
                </View>
              ) : null}
            </View>

            {/* ── Instruction box ── */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>⚠  How to get the DC Number</Text>
              {[
                "Open the Resolv App on your device.",
                "Go to Part Return → find this WO number.",
                'Tap "Request Pickup" to generate the DC number.',
                "Once generated, enter it below.",
              ].map((step, i) => (
                <View key={i} style={styles.instructionRow}>
                  <Text style={styles.instructionNum}>{i + 1}.</Text>
                  <Text style={styles.instructionText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* ── Section 1: DC Number ── */}
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <View style={styles.sectionNum}><Text style={styles.sectionNumText}>1</Text></View>
                <Text style={styles.sectionLabel}>DC NUMBER</Text>
              </View>
              <Text style={styles.fieldLabel}>DC Number <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={dcNumber}
                onChangeText={setDcNumber}
                placeholder="e.g. 19127"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="done"
              />
              <Text style={styles.fieldHint}>Enter the DC number exactly as shown in Resolv.</Text>
            </View>

            {/* ── Section 2: Same-ASP Parts ── */}
            {(loadingWOs || sameAspWOs.length > 0) ? (
              <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                  <View style={[styles.sectionNum, { backgroundColor: "#15803d" }]}><Text style={styles.sectionNumText}>2</Text></View>
                  <Text style={styles.sectionLabel}>ALSO APPLY TO SAME ASP WOs</Text>
                </View>

                {loadingWOs ? (
                  <ActivityIndicator size="small" color="#7c3aed" style={{ marginVertical: 12 }} />
                ) : (
                  <>
                    {/* Select all row */}
                    <View style={styles.selectAllRow}>
                      <Text style={styles.woListTitle}>Return-Part WOs — Same ASP</Text>
                      <TouchableOpacity onPress={selectAll}>
                        <Text style={styles.selectAllBtn}>{allSelected ? "Deselect all" : "Select all"}</Text>
                      </TouchableOpacity>
                    </View>

                    {sameAspWOs.map((g) => {
                      const isCurrent = woId != null && String(g.work_order_id) === String(woId);
                      return (
                        <View key={String(g.work_order_id)} style={[styles.woItem, isCurrent && styles.woItemCurrent]}>
                          {/* WO header row — no checkbox here */}
                          <View style={styles.woItemHeader}>
                            <Text style={[styles.woItemId, isCurrent && styles.woItemIdCurrent]}>
                              {g.work_order_id}
                            </Text>
                            {isCurrent ? (
                              <View style={styles.currentTag}><Text style={styles.currentTagText}>current WO</Text></View>
                            ) : null}
                            {g.work_order_status ? (
                              <View style={styles.woStatusBadge}><Text style={styles.woStatusBadgeText}>{g.work_order_status}</Text></View>
                            ) : null}
                          </View>
                          {g.completion_date ? (
                            <Text style={styles.woItemMeta}>Completed {g.completion_date.slice(0, 10)}</Text>
                          ) : null}

                          {/* Per-part checkboxes */}
                          {g.parts.map((p) => {
                            const key       = partKey(g.work_order_id, p.soid);
                            const isChecked = !!checked[key];
                            return (
                              <TouchableOpacity
                                key={key}
                                style={styles.partCheckRow}
                                onPress={() => togglePart(key)}
                                activeOpacity={0.7}
                              >
                                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                                  {isChecked ? <Text style={styles.checkmark}>✓</Text> : null}
                                </View>
                                <Text style={styles.woPartSoid}>{p.soid}</Text>
                                <Text style={styles.woPartDesc} numberOfLines={1}>{p.description}</Text>
                                {p.return_status ? (
                                  <View style={styles.returnStatusBadge}>
                                    <Text style={styles.returnStatusText}>{p.return_status}</Text>
                                  </View>
                                ) : null}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}
                    <Text style={styles.sameAspHint}>The same DC number will be applied to all checked parts' WOs.</Text>
                  </>
                )}
              </View>
            ) : null}

          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerHint}><Text style={{ color: "#dc2626" }}>*</Text> required fields</Text>
            <View style={styles.footerBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.submitBtnText}>✓  Submit DC Number</Text>
                }
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    overflow: "hidden",
  },

  // Header
  header:        { flexDirection: "row", alignItems: "center", gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  headerIcon:    { width: 36, height: 36, borderRadius: 9, backgroundColor: "#ede9fe", alignItems: "center", justifyContent: "center" },
  headerIconText:{ fontSize: 18 },
  headerTitle:   { fontSize: 16, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#1f2328" },
  headerSub:     { fontSize: 11, fontFamily: "IBMPlexSans_400Regular", color: "#57606a", marginTop: 1 },
  closeBtn:      { padding: 4 },
  closeBtnText:  { fontSize: 18, color: "#8c959f" },

  scroll:        { flexGrow: 1 },
  scrollContent: { paddingBottom: 8 },

  // WO Strip
  woStrip:          { backgroundColor: "#f7f8fa", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", padding: 12 },
  woStripTop:       { flexDirection: "row", alignItems: "center", gap: 8 },
  woStripLabel:     { fontSize: 10, fontWeight: "700", color: "#8c959f", textTransform: "uppercase", letterSpacing: 0.7 },
  woStripNum:       { fontSize: 15, fontWeight: "800", fontFamily: "IBMPlexSans_700Bold", color: "#1f2328" },
  woStripBadge:     { backgroundColor: "#e0e7ff", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  woStripBadgeText: { fontSize: 10, fontWeight: "700", color: "#4338ca" },
  woStripMeta:      { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  woTypePill:       { fontSize: 10, fontWeight: "700", color: "#3b5bdb", backgroundColor: "#f0f4ff", borderWidth: 1, borderColor: "#c5d0fa", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 1 },
  woStripAsp:       { fontSize: 12, color: "#57606a", fontFamily: "IBMPlexSans_400Regular" },
  partStrip:        { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, padding: 6, backgroundColor: "#fff", borderRadius: 6, borderWidth: 1, borderColor: "#e5e7eb" },
  partStripSoid:    { fontSize: 11, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#1f2328", backgroundColor: "#f0f2f5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  partStripDesc:    { fontSize: 11, color: "#57606a", flex: 1, fontFamily: "IBMPlexSans_400Regular" },

  // Instruction
  instructionBox:  { margin: 12, padding: 12, backgroundColor: "#fffbeb", borderLeftWidth: 3, borderLeftColor: "#f59e0b", borderRadius: 8 },
  instructionTitle:{ fontSize: 12, fontWeight: "700", color: "#92400e", marginBottom: 8, fontFamily: "IBMPlexSans_700Bold" },
  instructionRow:  { flexDirection: "row", gap: 6, marginBottom: 3 },
  instructionNum:  { fontSize: 12, color: "#78350f", fontWeight: "700", width: 16 },
  instructionText: { fontSize: 12, color: "#78350f", flex: 1, fontFamily: "IBMPlexSans_400Regular", lineHeight: 18 },

  // Section
  section:        { marginHorizontal: 12, marginBottom: 12, padding: 14, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  sectionLabelRow:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionNum:     { width: 18, height: 18, borderRadius: 9, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center" },
  sectionNumText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  sectionLabel:   { fontSize: 10, fontWeight: "700", color: "#8c959f", textTransform: "uppercase", letterSpacing: 0.7, flex: 1 },

  // Field
  fieldLabel:  { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6, fontFamily: "IBMPlexSans_600SemiBold" },
  req:         { color: "#dc2626" },
  input: {
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "IBMPlexSans_500Medium",
    color: "#1f2328",
    letterSpacing: 0.5,
  },
  fieldHint: { fontSize: 11, color: "#8c959f", marginTop: 5, fontFamily: "IBMPlexSans_400Regular" },

  // WO groups
  selectAllRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  woListTitle:   { fontSize: 11, fontWeight: "700", color: "#57606a", textTransform: "uppercase", letterSpacing: 0.4, fontFamily: "IBMPlexSans_700Bold" },
  selectAllBtn:  { fontSize: 11, fontWeight: "600", color: "#7c3aed", fontFamily: "IBMPlexSans_600SemiBold" },

  woItem:        { borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 8, backgroundColor: "#fff", overflow: "hidden" },
  woItemCurrent: { borderLeftWidth: 3, borderLeftColor: "#f59e0b", backgroundColor: "#fffbeb" },

  woItemHeader:  { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  woItemId:      { fontSize: 13, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#1f2328" },
  woItemIdCurrent: { color: "#92400e" },
  woItemMeta:    { fontSize: 11, color: "#57606a", paddingHorizontal: 10, paddingBottom: 4, fontFamily: "IBMPlexSans_400Regular" },

  currentTag:      { backgroundColor: "#fef3c7", borderWidth: 1, borderColor: "#f59e0b", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  currentTagText:  { fontSize: 10, fontWeight: "700", color: "#92400e" },
  woStatusBadge:   { backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  woStatusBadgeText:{ fontSize: 10, fontWeight: "700", color: "#374151" },

  // Per-part checkbox row
  partCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f0f2f5",
  },
  checkbox:        { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: "#d0d7de", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  checkmark:       { fontSize: 11, color: "#fff", fontWeight: "800" },
  woPartSoid:      { fontSize: 11, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#3b82d4", backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  woPartDesc:      { fontSize: 11, color: "#57606a", flex: 1, fontFamily: "IBMPlexSans_400Regular" },
  returnStatusBadge:{ backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  returnStatusText: { fontSize: 10, fontWeight: "600", color: "#c2410c" },
  sameAspHint:     { fontSize: 11, color: "#8c959f", marginTop: 6, fontFamily: "IBMPlexSans_400Regular" },

  // Footer
  footer:           { padding: 14, borderTopWidth: 1, borderTopColor: "#e5e7eb", flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff" },
  footerHint:       { fontSize: 11, color: "#8c959f", fontFamily: "IBMPlexSans_400Regular" },
  footerBtns:       { flexDirection: "row", gap: 8 },
  cancelBtn:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: "#d0d7de", backgroundColor: "#f7f8fa" },
  cancelBtnText:    { fontSize: 13, fontWeight: "600", color: "#374151", fontFamily: "IBMPlexSans_600SemiBold" },
  submitBtn:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, backgroundColor: "#7c3aed", minWidth: 80, alignItems: "center" },
  submitBtnDisabled:{ opacity: 0.6 },
  submitBtnText:    { fontSize: 13, fontWeight: "700", color: "#fff", fontFamily: "IBMPlexSans_700Bold" },
});
