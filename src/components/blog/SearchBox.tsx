"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Intentionally only re-run on `value` change — router/pathname/searchParams
    // are stable enough here and including them would re-trigger on every push.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles…"
        aria-label="Search articles"
        className="w-full rounded-md border border-border py-2.5 pl-10 pr-3 text-sm"
      />
    </div>
  );
}
