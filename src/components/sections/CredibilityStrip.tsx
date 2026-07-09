import { Container } from "@/components/ui/Container";
import { CREDIBILITY_STATS } from "@/lib/constants";

export function CredibilityStrip() {
  return (
    <section className="border-y border-border bg-brand-blue-dark py-12">
      <Container>
        <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {CREDIBILITY_STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-2xl font-bold text-white sm:text-3xl">
                {stat.value}
              </dd>
              <p className="mt-1 text-xs text-brand-blue-light sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
