import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-32 text-center">
      <p className="font-mono text-sm text-brand-blue">404</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-4 max-w-md text-text-body">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-8">
        <Button href="/" variant="primary">
          Back Home
        </Button>
      </div>
    </Container>
  );
}
