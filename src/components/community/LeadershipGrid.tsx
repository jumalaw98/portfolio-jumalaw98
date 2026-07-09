import { LeadershipCard } from "./LeadershipCard";
import type { CommunityRole } from "@/content/community";

interface LeadershipGridProps {
  roles: CommunityRole[];
}

export function LeadershipGrid({ roles }: LeadershipGridProps) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2" role="list">
      {roles.map((role, i) => (
        <li key={role.org} className="h-full list-none">
          <LeadershipCard role={role} index={i} />
        </li>
      ))}
    </ul>
  );
}
