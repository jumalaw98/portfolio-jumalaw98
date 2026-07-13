import { Mic, Radio } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { LeadershipGrid } from "@/components/community/LeadershipGrid";
import { ImpactStatsGrid } from "@/components/community/ImpactStatsGrid";
import { SpeakingGrid } from "@/components/community/SpeakingGrid";
import { RevealSection } from "@/components/ui/RevealSection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  communityRoles,
  campusTourNote,
  speakingEngagements,
  liveSessionsNote,
} from "@/content/community";
import { impactStats } from "@/content/impact-stats";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Community & Speaking — DevOps & Tech Community Leadership in Kenya",
  description:
    "Lawrence Juma's community leadership, conference talks, and events work across East Africa's technical communities — Nairobi DevOps Community, InfoSec365, Africa DevOps Summit, and more.",
  path: "/community",
});

export default function CommunityPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Community", path: "/community" }])} />

      {/* Intro */}
      <section className="border-b border-border bg-brand-blue-tint py-16">
        <Container className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Community &amp; Speaking
          </h1>
          <p className="mt-4 text-lg text-text-body">
            Alongside my engineering work, I&apos;ve spent the last several years building and
            leading technical communities across East Africa.
          </p>
        </Container>
      </section>

      {/* Roles & Leadership */}
      <RevealSection>
        <section className="py-16">
          <Container className="max-w-5xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Roles &amp; Leadership
            </h2>
            <p className="mt-3 max-w-2xl text-text-body">
              None of these are solo projects, and I want to be upfront about that, each card below
              is scoped to what I actually did, not the size of the organization behind it.
            </p>
            <div className="mt-8">
              <LeadershipGrid roles={communityRoles} />
            </div>
          </Container>
        </section>
      </RevealSection>

      {/* Impact Numbers */}
      <RevealSection>
        <section className="border-y border-border bg-brand-blue-tint py-16">
          <Container className="max-w-5xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Impact Numbers</h2>
            <p className="mt-3 max-w-2xl text-text-body">
              These numbers pull from everything on this site, not just one community, every talk,
              every role, every event that&apos;s actually documented here.
            </p>
            <div className="mt-8">
              <ImpactStatsGrid stats={impactStats} />
            </div>
            <p className="mt-6 text-sm text-text-muted">{campusTourNote}</p>
          </Container>
        </section>
      </RevealSection>

      {/* Speaking Engagements */}
      <RevealSection>
        <section className="py-16">
          <Container className="max-w-5xl">
            <div className="flex items-center gap-3">
              <Mic size={24} className="text-brand-blue" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Speaking Engagements
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-text-body">
              A few of the talks I&apos;ve given over the years, spanning AI, open source
              sustainability, inclusive engineering culture, and privacy by design.
            </p>
            <div className="mt-8">
              <SpeakingGrid talks={speakingEngagements} />
            </div>
          </Container>
        </section>
      </RevealSection>

      {/* Live Sessions & Content */}
      <RevealSection>
        <section className="border-t border-border bg-brand-blue-tint py-16">
          <Container className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Radio size={24} className="text-brand-blue" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Live Sessions &amp; Content
              </h2>
            </div>
            <div className="mt-6 flex flex-col gap-3 text-text-body">
              <p>{liveSessionsNote.host}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={liveSessionsNote.sytTechTalkPlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  #SYTTechTalk Playlist
                </a>
                <span>•</span>
                <a
                  href={liveSessionsNote.technicalWritingSessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  Technical Writing Session
                </a>
              </div>
              <p>{liveSessionsNote.additional}</p>
              <p className="text-sm text-text-muted">
                {liveSessionsNote.topSession}{" "}
                <a
                  href={liveSessionsNote.topSessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  Watch Session
                </a>
              </p>
            </div>
          </Container>
        </section>
      </RevealSection>

      {/* CTA */}
      <RevealSection>
        <section className="py-16 text-center">
          <Container className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Organizing an event or looking to partner?
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button href="/contact" variant="primary">
                Get In Touch
              </Button>
            </div>
          </Container>
        </section>
      </RevealSection>
    </>
  );
}
