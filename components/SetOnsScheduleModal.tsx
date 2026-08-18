// components/SetOnsScheduleModal.tsx
// Modal form: Set ONS Schedule — mirrors the web dashboard "modal-onsite-recv".
// Sections:
//   1. Arrival Details  — date & time part arrived
//   2. Defer Details    — reschedule reason (grouped) + new appointment date
//   3. Chat Evidence    — pick image from gallery as evidence
//
// Section 1 is hidden when the WO already has a POD date (hasPod=true),
// matching the web behaviour exactly.

import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";

// DateTimePicker is native-only — import lazily so web bundle never touches it.
// On web we render a hidden <input type="datetime-local"> instead.
let DateTimePicker: any = null;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

// ── Defer reason options (matches the web dropdown exactly) ──────────────────

interface DeferOption {
  value: string;
  group: string;
}

const DEFER_OPTIONS: DeferOption[] = [
  // ASP Defer
  { value: "Teknisi Overload",                      group: "ASP Defer" },
  { value: "Teknisi Sakit",                         group: "ASP Defer" },
  { value: "Teknisi masih handle customer lain",    group: "ASP Defer" },
  // Customer Defer
  { value: "Customer Sibuk",                        group: "Customer Defer" },
  { value: "Customer tidak bisa dihubungi",         group: "Customer Defer" },
  { value: "Customer tidak ada dirumah",            group: "Customer Defer" },
  { value: "Customer tidak ada dikantor",           group: "Customer Defer" },
  { value: "Customer cuti",                         group: "Customer Defer" },
  { value: "Customer diluar kota",                  group: "Customer Defer" },
  { value: "Customer keluar negeri",                group: "Customer Defer" },
  { value: "Customer request di weekend",           group: "Customer Defer" },
  { value: "Customer request tanggal tertentu",     group: "Customer Defer" },
  { value: "Customer sakit",                        group: "Customer Defer" },
  { value: "Unit masih digunakan oleh customer",    group: "Customer Defer" },
  { value: "Unit customer belum sampai (tersedia)", group: "Customer Defer" },
];

const DEFER_GROUPS = ["ASP Defer", "Customer Defer"];

// ── Props ─────────────────────────────────────────────────────────────────────

interface WO {
  work_order_id: number;
  work_order_type?: string;
  work_order_status?: string;
  ship_pou_pod_time?: string; // if set, section 1 is hidden
}

interface Props {
  visible: boolean;
  wo: WO | null;
  onClose: () => void;
  onSuccess?: (wo: WO) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function hasPodDate(wo: WO | null): boolean {
  const p = wo?.ship_pou_pod_time?.trim();
  if (!p) return false;
  // Sentinel values used by the backend (match web isSentinel check)
  return !!p && p !== "—" && p !== "-" && p !== "N/A" && p !== "null";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SetOnsScheduleModal({ visible, wo, onClose, onSuccess }: Props) {
  const podExists = hasPodDate(wo);

  // Section 1 — Arrival Details
  const [arrivalDate, setArrivalDate]             = useState<Date | null>(null);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const arrivalInputRef                           = useRef<any>(null);

  // Section 2 — Defer Details
  const [deferReason, setDeferReason]             = useState<DeferOption | null>(null);
  const [deferReasonSheetOpen, setDeferReasonSheetOpen] = useState(false);
  const [appointmentDate, setAppointmentDate]     = useState<Date | null>(null);
  const [showAppointmentPicker, setShowAppointmentPicker] = useState(false);
  const appointmentInputRef                       = useRef<any>(null);

  // Section 3 — Chat Evidence
  const [evidenceUri, setEvidenceUri]           = useState<string | null>(null);
  const [evidenceName, setEvidenceName]         = useState<string | null>(null);

  // Submission
  const [submitting, setSubmitting]             = useState(false);

  // Reset form when modal opens / WO changes
  useEffect(() => {
    if (!visible) return;
    setArrivalDate(null);
    setShowArrivalPicker(false);
    setDeferReason(null);
    setDeferReasonSheetOpen(false);
    setAppointmentDate(null);
    setShowAppointmentPicker(false);
    setEvidenceUri(null);
    setEvidenceName(null);
    setSubmitting(false);
  }, [visible, wo?.work_order_id]);

  // ── Pickers ──

  function handleArrivalChange(_: any, d?: Date) {
    setShowArrivalPicker(Platform.OS === "ios");
    if (d) setArrivalDate(d);
  }

  function handleAppointmentChange(_: any, d?: Date) {
    setShowAppointmentPicker(Platform.OS === "ios");
    if (d) setAppointmentDate(d);
  }

  // Web: programmatically click the hidden <input> when the styled button is pressed
  function openArrivalPicker() {
    if (Platform.OS === "web") {
      arrivalInputRef.current?.click();
    } else {
      setShowArrivalPicker(true);
    }
  }

  function openAppointmentPicker() {
    if (Platform.OS === "web") {
      appointmentInputRef.current?.click();
    } else {
      setShowAppointmentPicker(true);
    }
  }

  async function pickEvidence() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setEvidenceUri(asset.uri);
      setEvidenceName(asset.fileName ?? asset.uri.split("/").pop() ?? "evidence.jpg");
    }
  }

  // ── Validation & submit ──

  async function handleSubmit() {
    if (!wo) return;

    if (!podExists && !arrivalDate) {
      Alert.alert("Validation", "Please enter the date & time the part arrived.");
      return;
    }
    if (!deferReason) {
      Alert.alert("Validation", "Please select a defer type & reason.");
      return;
    }
    if (!appointmentDate) {
      Alert.alert("Validation", "Please select a new appointment date.");
      return;
    }
    if (appointmentDate <= new Date()) {
      Alert.alert("Validation", "New appointment date must be in the future.");
      return;
    }
    if (!evidenceUri) {
      Alert.alert("Validation", "Please upload a chat screenshot as evidence.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("wo_id",           String(wo.work_order_id));
      form.append("defer_reason",    deferReason.value);
      form.append("defer_by",        deferReason.group);
      form.append("appointment_date", formatDatetimeLocal(appointmentDate));
      if (!podExists && arrivalDate) {
        form.append("arrival_datetime", formatDatetimeLocal(arrivalDate));
      }

      // Attach evidence file
      const ext      = (evidenceName ?? "evidence.jpg").split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType = ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`;
      (form as any).append("evidence", {
        uri:  evidenceUri,
        name: evidenceName ?? "evidence.jpg",
        type: mimeType,
      } as any);

      await api.post("/api/v1/mobile/onsite-set-schedule", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess?.(wo);
      onClose();
      Alert.alert("Success", `ONS Schedule set for WO #${wo.work_order_id}.`);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Request failed";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!wo) return null;

  const sectionDeferNum    = podExists ? "1" : "2";
  const sectionEvidenceNum = podExists ? "2" : "3";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Backdrop tap to dismiss */}
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerIconWrap}>
              {/* Calendar SVG converted to a plain emoji-like representation */}
              <Text style={styles.headerIcon}>📅</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Set Onsite Schedule</Text>
              <Text style={styles.headerSub}>Record part arrival &amp; schedule the visit</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── WO Context Strip ── */}
            <View style={styles.woStrip}>
              <View style={styles.woStripTop}>
                <Text style={styles.woLabel}>WO#</Text>
                <Text style={styles.woNum}>{wo.work_order_id}</Text>
                {wo.work_order_status ? (
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{wo.work_order_status}</Text>
                  </View>
                ) : null}
              </View>
              {wo.work_order_type ? (
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{wo.work_order_type}</Text>
                </View>
              ) : null}
            </View>

            {/* ── SECTION 1 — Arrival Details (hidden when POD already exists) ── */}
            {!podExists && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.secNum, { backgroundColor: "#3b82d4" }]}>
                    <Text style={styles.secNumText}>1</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Arrival Details</Text>
                </View>

                <Text style={styles.fieldLabel}>
                  Date &amp; Time Part Arrived <Text style={styles.req}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={openArrivalPicker}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.datePickerBtnText, !arrivalDate && styles.datePlaceholder]}>
                    {arrivalDate ? formatDatetimeLocal(arrivalDate).replace("T", "  ") : "Select arrival date & time…"}
                  </Text>
                  <Text style={styles.datePickerIcon}>🗓</Text>
                </TouchableOpacity>
                {Platform.OS === "web" ? (
                  // Hidden native datetime input — the styled button above calls .click() on it
                  <input
                    ref={arrivalInputRef}
                    type="datetime-local"
                    max={formatDatetimeLocal(new Date())}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) setArrivalDate(new Date(v));
                    }}
                  />
                ) : showArrivalPicker ? (
                  <DateTimePicker
                    value={arrivalDate ?? new Date()}
                    mode="datetime"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    maximumDate={new Date()}
                    onChange={handleArrivalChange}
                  />
                ) : null}
              </View>
            )}

            {/* ── SECTION 2 — Defer Details ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.secNum, { backgroundColor: "#d97706" }]}>
                  <Text style={styles.secNumText}>{sectionDeferNum}</Text>
                </View>
                <Text style={styles.sectionTitle}>Defer Details</Text>
              </View>

              {/* Defer Reason */}
              <Text style={styles.fieldLabel}>
                Reschedule by / Reason <Text style={styles.req}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setDeferReasonSheetOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownBtnText, !deferReason && styles.dropdownPlaceholder]}>
                  {deferReason
                    ? `[${deferReason.group}] ${deferReason.value}`
                    : "— Select defer type & reason —"}
                </Text>
                <Text style={styles.dropdownArrow}>▾</Text>
              </TouchableOpacity>

              {/* New Appointment Date */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                New Appointment Date <Text style={styles.req}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={openAppointmentPicker}
                activeOpacity={0.7}
              >
                <Text style={[styles.datePickerBtnText, !appointmentDate && styles.datePlaceholder]}>
                  {appointmentDate ? formatDatetimeLocal(appointmentDate).replace("T", "  ") : "Select new appointment date…"}
                </Text>
                <Text style={styles.datePickerIcon}>🗓</Text>
              </TouchableOpacity>
              {Platform.OS === "web" ? (
                // Hidden native datetime input — the styled button above calls .click() on it
                <input
                  ref={appointmentInputRef}
                  type="datetime-local"
                  min={formatDatetimeLocal(new Date())}
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) setAppointmentDate(new Date(v));
                  }}
                />
              ) : showAppointmentPicker ? (
                <DateTimePicker
                  value={appointmentDate ?? new Date()}
                  mode="datetime"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={new Date()}
                  onChange={handleAppointmentChange}
                />
              ) : null}
            </View>

            {/* ── SECTION 3 — Chat Evidence ── */}
            <View style={[styles.section, { marginBottom: 0 }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.secNum, { backgroundColor: "#d97706" }]}>
                  <Text style={styles.secNumText}>{sectionEvidenceNum}</Text>
                </View>
                <Text style={styles.sectionTitle}>Chat Evidence with Customer</Text>
              </View>

              <Text style={styles.fieldLabel}>
                Upload Chat Screenshot <Text style={styles.req}>*</Text>
              </Text>

              {evidenceUri ? (
                <View style={styles.evidencePreviewWrap}>
                  <Image source={{ uri: evidenceUri }} style={styles.evidencePreviewImg} resizeMode="contain" />
                  <View style={styles.evidenceChosen}>
                    <Text style={styles.evidenceChosenName} numberOfLines={1}>✓  {evidenceName}</Text>
                    <TouchableOpacity onPress={() => { setEvidenceUri(null); setEvidenceName(null); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={styles.evidenceRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadZone} onPress={pickEvidence} activeOpacity={0.7}>
                  <Text style={styles.uploadIcon}>⬆</Text>
                  <Text style={styles.uploadText}>Tap to upload chat screenshot or evidence</Text>
                  <Text style={styles.uploadSub}>PNG, JPG — max 5 MB</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerHint}><Text style={{ fontWeight: "700" }}>*</Text> required fields</Text>
            <View style={styles.footerBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>✓  Set Onsite Schedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Defer Reason Picker Sheet ── */}
      <Modal
        visible={deferReasonSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setDeferReasonSheetOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity style={styles.backdrop} onPress={() => setDeferReasonSheetOpen(false)} activeOpacity={1} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Reschedule by / Reason</Text>
              <TouchableOpacity onPress={() => setDeferReasonSheetOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {DEFER_GROUPS.map((group) => (
                <View key={group}>
                  <Text style={styles.optionGroupLabel}>{group}</Text>
                  {DEFER_OPTIONS.filter((o) => o.group === group).map((opt) => {
                    const selected = deferReason?.value === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.optionRow, selected && styles.optionRowSelected]}
                        onPress={() => {
                          setDeferReason(opt);
                          setDeferReasonSheetOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                          {opt.value}
                        </Text>
                        {selected && <Text style={styles.optionCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: "flex-end" },
  backdrop:    { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)" },

  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "92%",
    overflow: "hidden",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 10,
  },
  headerIconWrap:  { width: 36, height: 36, borderRadius: 8, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", alignItems: "center", justifyContent: "center" },
  headerIcon:      { fontSize: 18 },
  headerTextWrap:  { flex: 1 },
  headerTitle:     { fontSize: 15, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#1f2328" },
  headerSub:       { fontSize: 11, color: "#57606a", fontFamily: "IBMPlexSans_400Regular", marginTop: 1 },
  closeBtn:        { padding: 4 },
  closeBtnText:    { fontSize: 16, color: "#57606a", fontWeight: "600" },

  scroll:          { flexGrow: 1 },
  scrollContent:   { padding: 16, paddingBottom: 8 },

  // WO Strip
  woStrip: {
    backgroundColor: "#f7f8fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  woStripTop:       { flexDirection: "row", alignItems: "center", gap: 8 },
  woLabel:          { fontSize: 10, fontWeight: "700", color: "#8c959f", letterSpacing: 0.7, textTransform: "uppercase", fontFamily: "IBMPlexSans_700Bold" },
  woNum:            { fontSize: 16, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#1f2328" },
  statusPill:       { backgroundColor: "#dbeafe", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  statusPillText:   { fontSize: 10, fontWeight: "700", color: "#1d4ed8", fontFamily: "IBMPlexSans_700Bold" },
  typePill:         { backgroundColor: "#f0fdf4", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, alignSelf: "flex-start" },
  typePillText:     { fontSize: 10, fontWeight: "600", color: "#15803d", fontFamily: "IBMPlexSans_600SemiBold" },

  // Sections
  section: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  secNum:        { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  secNumText:    { fontSize: 11, fontWeight: "700", color: "#fff", fontFamily: "IBMPlexSans_700Bold" },
  sectionTitle:  { fontSize: 12, fontWeight: "700", color: "#374151", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "IBMPlexSans_700Bold" },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "IBMPlexSans_600SemiBold",
    marginBottom: 6,
  },
  req: { color: "#dc2626" },

  // Date picker button
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
  },
  datePickerBtnText: { flex: 1, fontSize: 14, color: "#1f2328", fontFamily: "IBMPlexSans_400Regular" },
  datePickerIcon:    { fontSize: 16 },
  datePlaceholder:   { color: "#9ca3af" },

  // Dropdown button
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
  },
  dropdownBtnText:   { flex: 1, fontSize: 14, color: "#1f2328", fontFamily: "IBMPlexSans_400Regular" },
  dropdownPlaceholder: { color: "#9ca3af" },
  dropdownArrow:     { fontSize: 12, color: "#57606a" },

  // Upload zone
  uploadZone: {
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 6,
    backgroundColor: "#f9fafb",
  },
  uploadIcon: { fontSize: 22, color: "#9ca3af" },
  uploadText: { fontSize: 13, color: "#374151", fontFamily: "IBMPlexSans_400Regular", textAlign: "center" },
  uploadSub:  { fontSize: 11, color: "#9ca3af", fontFamily: "IBMPlexSans_400Regular" },

  // Evidence preview
  evidencePreviewWrap: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, overflow: "hidden" },
  evidencePreviewImg:  { width: "100%", height: 180, backgroundColor: "#f3f4f6" },
  evidenceChosen: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f0fdf4",
    gap: 8,
  },
  evidenceChosenName: { flex: 1, fontSize: 12, color: "#15803d", fontFamily: "IBMPlexSans_400Regular" },
  evidenceRemove:     { fontSize: 13, color: "#dc2626", fontWeight: "700" },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 10,
    backgroundColor: "#fff",
  },
  footerHint:     { flex: 1, fontSize: 11, color: "#6b7280", fontFamily: "IBMPlexSans_400Regular" },
  footerBtns:     { flexDirection: "row", gap: 8 },
  cancelBtn:      { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, paddingHorizontal: 16, paddingVertical: 9 },
  cancelBtnText:  { fontSize: 13, color: "#374151", fontFamily: "IBMPlexSans_600SemiBold", fontWeight: "600" },
  submitBtn:      { backgroundColor: "#3b82d4", borderRadius: 6, paddingHorizontal: 16, paddingVertical: 9, minWidth: 140, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:  { fontSize: 13, color: "#fff", fontFamily: "IBMPlexSans_700Bold", fontWeight: "700" },

  // Defer picker sheet
  pickerOverlay: { flex: 1, justifyContent: "flex-end" },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  pickerTitle:   { fontSize: 15, fontWeight: "700", fontFamily: "IBMPlexSans_700Bold", color: "#1f2328" },
  optionGroupLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8c959f",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    fontFamily: "IBMPlexSans_700Bold",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  optionRowSelected: { backgroundColor: "#eff6ff" },
  optionText:        { flex: 1, fontSize: 14, color: "#1f2328", fontFamily: "IBMPlexSans_400Regular" },
  optionTextSelected: { color: "#3b82d4", fontWeight: "600", fontFamily: "IBMPlexSans_600SemiBold" },
  optionCheck:       { fontSize: 14, color: "#3b82d4", fontWeight: "700" },
});
