// app/(tabs)/followup/cci.tsx
import { WOScreen } from "../../../components/WOScreen";

export default function CCIFollowupScreen() {
  return (
    <WOScreen
      endpoint="/api/v1/mobile/cci-followup"
      emptyText="No CCI Follow-Up work orders for your ASP."
    />
  );
}
