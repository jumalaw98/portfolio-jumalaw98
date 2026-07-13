import { AnimatedStat } from "./AnimatedStat";
import type { ImpactStat } from "@/content/impact-stats";

interface ImpactStatsGridProps {
  readonly stats: readonly ImpactStat[];
}

export function ImpactStatsGrid({ stats }: Readonly<ImpactStatsGridProps>) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map((stat, i) => (
        <AnimatedStat key={stat.label} stat={stat} index={i} />
      ))}
    </div>
  );
}
