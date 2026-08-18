// app/(tabs)/in-return.tsx
// Return Part / In-Return screen — reached from the Home menu card.
// Shows a count banner and the full WO list for parts awaiting return.

import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WOScreen } from "../../components/WOScreen";
import { useStats } from "../../hooks/useStats";
import { InputDCModal } from "../../components/InputDCModal";

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

const ACCENT = "#7c3aed";

export default function InReturnScreen() {
  const [dcModal, setDcModal] = useState<{
    visible: boolean;
    woId: number | null;
    woType?: string;
    woStatus?: string;
    aspName?: string;
    partSoid?: number | string;
    partDescription?: string;
  }>({ visible: false, woId: null });

  const handleInputDC = (woId: number, part: any) => {
    setDcModal({
      visible:         true,
      woId,
      woType:          part.work_order_type,
      woStatus:        part.wo_product_status,
      aspName:         part.customer,
      partSoid:        part.soid,
      partDescription: part.description,
    });
  };

  const closeDcModal = () => setDcModal((prev) => ({ ...prev, visible: false }));

  return (
    <View style={{ flex: 1 }}>
      <ReturnPartBanner />
      <WOScreen
        endpoint="/api/v1/mobile/return-part"
        extraParams={{ followup_state: "need_to_return" }}
        accentColor={ACCENT}
        emptyText="No Return Part work orders for your ASP."
        onInputDC={handleInputDC}
      />
      <InputDCModal
        visible={dcModal.visible}
        woId={dcModal.woId}
        woType={dcModal.woType}
        woStatus={dcModal.woStatus}
        aspName={dcModal.aspName}
        partSoid={dcModal.partSoid}
        partDescription={dcModal.partDescription}
        onClose={closeDcModal}
        onSuccess={(dc, woIds) => {
          // Optionally trigger a list refresh here in future
          console.log(`DC ${dc} saved for WOs: ${woIds.join(", ")}`);
        }}
      />
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
    fontFamily: "IBMPlexSans_600SemiBold",
    color: "#7c3aed",
  },
});
