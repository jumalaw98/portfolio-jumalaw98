import { SpeakingCard } from "./SpeakingCard";
import type { SpeakingEngagement } from "@/content/community";

interface SpeakingGridProps {
  talks: SpeakingEngagement[];
}

export function SpeakingGrid({ talks }: SpeakingGridProps) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {talks.map((talk, i) => (
        <li key={`${talk.event}-${talk.date}`} className="h-full list-none">
          <SpeakingCard talk={talk} priority={i === 0} />
        </li>
      ))}
    </ul>
  );
}
