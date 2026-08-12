// app/(tabs)/followup/onsite.tsx
import { WOScreen } from "../../../components/WOScreen";

export default function OnsiteFollowupScreen() {
  return (
    <WOScreen
      endpoint="/api/v1/mobile/onsite-followup"
      emptyText="No Onsite Follow-Up work orders for your ASP."
    />
  );
}
