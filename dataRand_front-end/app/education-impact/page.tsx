import EducationImpact from "@/components/pages/EducationImpact";
import { Suspense } from "react";

export default function EducationImpactPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EducationImpact />
    </Suspense>
  );
}
