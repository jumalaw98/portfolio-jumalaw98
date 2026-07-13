import { SpeakingCard } from "./SpeakingCard";
import type { SpeakingEngagement } from "@/content/community";

interface SpeakingGridProps {
  talks: SpeakingEngagement[];
}

export function SpeakingGrid({ talks }: SpeakingGridProps) {
  return (
    <ul className="flex flex-col gap-4" role="list">
      {talks.map((talk) => (
        <li key={`${talk.event}-${talk.date}`} className="list-none">
          <SpeakingCard talk={talk} />
        </li>
      ))}
    </ul>
  );
}
