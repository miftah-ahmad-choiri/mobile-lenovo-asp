// app/(tabs)/followup/in-prepare.tsx
import { WOScreen } from "../../../components/WOScreen";

export default function InPrepareScreen() {
  return (
    <WOScreen
      endpoint="/api/v1/mobile/in-prepare"
      emptyText="No In-Prepare work orders for your ASP."
    />
  );
}
