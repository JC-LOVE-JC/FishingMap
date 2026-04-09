import { FishingTravelPlannerApp } from "@/components/fishing-travel-planner-app";

export default function SharedTripMapPage({
  params
}: {
  params: {
    slug: string;
  };
}) {
  return <FishingTravelPlannerApp sharedSlug={params.slug} />;
}
