import { Container } from "@/components/ui/Container";
import { STACK_HIGHLIGHTS } from "@/lib/constants";

export function StackHighlights() {
  return (
    <section className="py-14">
      <Container>
        <p className="text-center font-mono text-xs uppercase tracking-widest text-text-muted">
          Core Stack
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {STACK_HIGHLIGHTS.map((tech) => (
            <li
              key={tech}
              className="font-mono text-sm font-medium text-text-body"
            >
              {tech}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
