import { getLandingPublicData } from "@/data/rh/landing.data";
import { PublicLandingPage } from "@/features/public/PublicLandingPage";

export default async function HomePage() {
  const data = await getLandingPublicData();

  return <PublicLandingPage data={data} />;
}