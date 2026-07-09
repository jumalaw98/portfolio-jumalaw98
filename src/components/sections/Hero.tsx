import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";

interface HeroProps {
  headline: string;
  subline: string;
  headshotSrc?: string; // TODO: swap to /images/headshot.jpg once the real photo is ready
}

export function Hero({
  headline,
  subline,
  headshotSrc = PLACEHOLDER_IMAGES.headshot,
}: HeroProps) {
  return (
    <section className="border-b border-border bg-brand-blue-tint">
      <Container className="grid gap-10 py-20 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-28">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-text-body">{subline}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/projects" variant="primary">
              View My Work
            </Button>
            <Button href="/contact" variant="ghost">
              Get In Touch
            </Button>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-brand-blue md:max-w-none">
          {headshotSrc ? (
            <Image
              src={headshotSrc}
              alt="Lawrence Juma"
              fill
              sizes="(min-width: 768px) 33vw, 80vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-6xl font-bold text-white">JLW</span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
