// app/(tabs)/in-prepare.tsx
// In-Prepare work orders screen — reached from the Home menu card.

import { WOScreen } from "../../components/WOScreen";

const ACCENT = "#0f3460";

export default function InPrepareScreen() {
  return (
    <WOScreen
      endpoint="/api/v1/mobile/in-prepare"
      accentColor={ACCENT}
      emptyText="No In-Prepare work orders for your ASP."
    />
  );
}
