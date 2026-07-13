export interface CommunityLinks {
  website?: string; // TODO: confirm/add for orgs marked below
  github?: string;
  linkedin?: string;
  meetup?: string;
  discord?: string;
}

export interface CommunityRole {
  org: string;
  role: string;
  dates: string; // duration of involvement, e.g. "2023–ongoing"
  description: string; // 2–4 sentences on the org's mission/community — drafted, review wording
  responsibilities?: string[]; // optional highlights — drafted, review wording
  tags: string[]; // 3–5 focus areas
  logoUrl?: string; // TODO: drop in the org's real logo (SVG/PNG) once available
  logoInitials: string; // fallback shown until a real logo is added
  links?: CommunityLinks;
}

// Final roster — portfolio-content.md Section 6b, extended with description/
// responsibilities/tags/links for the redesigned leadership card. Descriptions,
// responsibilities, and tags below are drafted summaries — review and tighten
// the wording. No logo files or organization links are fabricated: only
// Nairobi DevOps Community's website is confirmed elsewhere in this project
// (portfolio-content.md Section 2a/2b); every other link is left undefined
// with a TODO until Lawrence confirms it. Each role reflects actual scope,
// not implied sole ownership of any organization, per honesty-boundaries
// guidance in the brand profile.
export const communityRoles: CommunityRole[] = [
  {
    org: "InfoSec365",
    role: "Co-founder & Community Manager",
    dates: "2024–ongoing",
    description:
      "Collaborate. Innovate. Elevate: Cybersecurity community focused on training beginners through practical challenges and knowledge sharing.",
    responsibilities: [
      "Co-founded the community and helped shape its direction",
      "Community management and member engagement",
    ],
    tags: ["Cybersecurity", "Community Building", "Mentorship"],
    logoInitials: "IS",
    links: {
      website: "https://infosec365.africa/",
    },
  },
  {
    org: "Nairobi DevOps Community",
    role: "Community Manager & Events Manager",
    dates: "2023–ongoing (deepened to Program Coordinator/Project Manager in 2025)",
    description:
      "Innovate. Empower. Grow: A community promoting collaboration, innovation, and best practices within the DevOps industry in Nairobi and beyond, 5,000+ members across its platforms.",
    responsibilities: [
      "Event planning and speaker coordination",
      "Sponsor and partner relations",
      "Led the platform rebuild (see Projects, Nairobi DevOps Community Rebuild)",
    ],
    tags: ["DevOps", "Cloud", "Event Organizing", "Community Growth"],
    logoInitials: "ND",
    links: {
      website: "https://nairobidevops.org/",
    },
  },
  {
    org: "SpaceYaTech Community",
    role: "Community Manager & Social Media Manager",
    dates: "2022–ongoing",
    description:
      "Fast-growing open-source community for tech enthusiasts, developers, and aspirants across Africa, providing resources, mentorship, and networking opportunities.",
    responsibilities: [
      "Manages the community's social media presence",
      "Hosts #SYTTechTalk sessions",
    ],
    tags: ["Open Source", "Tech Education", "Social Media", "Community Management"],
    logoInitials: "SY",
    links: {
      website: "https://spaceyatech.com/",
    },
  },
  {
    org: "GDSC The Kisumu National Polytechnic",
    role: "Technical Lead, Core Team",
    dates: "2022–2023",
    description:
      "The Google Developer Student Clubs chapter at The Kisumu National Polytechnic, students getting hands-on with Google's tools and platforms, mostly through workshops the core team ran ourselves.",
    responsibilities: ["Technical leadership for the core team", "Workshop delivery"],
    tags: ["Google Technologies", "Student Community", "Technical Leadership"],
    logoInitials: "GD",
    links: {
      website: undefined,
    },
  },
  {
    org: "SheCodeAfrica Nairobi",
    role: "Technical Writer Lead",
    dates: "2023–2024",
    description:
      "SheCodeAfrica's Nairobi chapter, part of a pan-African network supporting women in tech through mentorship and training. I led the chapter's technical writing side, the content calendar, the writing team, all of it.",
    responsibilities: [
      "Led the technical writing team",
      "Created and maintained the content calendar",
    ],
    tags: ["Technical Writing", "Women in Tech", "Content Strategy"],
    logoInitials: "SA",
    links: {
      website: "https://shecodeafricanairobi.org/",
    },
  },
  // {
  //   org: "WesternCyberHub",
  //   role: "Community Manager & Editorial Lead",
  //   dates: "2024",
  //   description:
  //     "A cybersecurity community for Western Kenya, connecting people still learning with working professionals through whatever content and programming we put out.",
  //   responsibilities: ["Community management", "Editorial oversight of published content"],
  //   tags: ["Cybersecurity", "Editorial", "Community Management"],
  //   logoInitials: "WC",
  //   links: {
  //     website: undefined,
  //   },
  // },
  {
    org: "WTD Kenya",
    role: "Partnership and Outreach",
    dates: "2025-2026",
    description:
      "A community for everyone who cares about communication, documentation, and technical writing in Kenya.",
    tags: ["Technical Writing", "Documentation", "Community"],
    logoInitials: "WT",
    links: {
      website: "https://wtdke.netlify.app/",
    },
  },
];

export const campusTourNote =
  "Campus/compass tour initiative: ongoing community outreach program under Nairobi DevOps Community.";

export interface SpeakingResources {
  slidesUrl?: string;
  videoUrl?: string;
  eventPageUrl?: string;
}

// Speaking Engagements
export interface SpeakingEngagement {
  date: string;
  event: string;
  location: string;
  talk: string;
  description: string;
  tags: [string, string, string];
  resources?: SpeakingResources;
  imageUrl?: string;
}

// Final list — portfolio-content.md Section 6d, extended with description/
// location/tags/resources for the redesigned card. Descriptions and tags below
// are drafted summaries derived from the confirmed talk titles — review and
// tighten the wording, and fill in `location` + `resources` once confirmed.
// No resource links are fabricated: `resources` is left undefined until real
// slides/video/event-page links exist, so the CTA only appears once there's
// something real to link to.
export const speakingEngagements: SpeakingEngagement[] = [
  {
    date: "Apr 2024",
    event: "Sarit Center, TEMS Africa ICT Expo 2024",
    location: "Nairobi, Kenya",
    talk: "Building Privacy into Systems from the Start",
    description:
      "The case for privacy-by-design: retrofitting privacy after launch almost always costs more than doing it upfront, so I made the argument for baking data protection into your architecture decisions from day one.",
    tags: ["Privacy", "Security", "System Design"],
    resources: {
      slidesUrl:
        "https://speakerdeck.com/jumalaw98/building-privacy-into-systems-from-the-start-the-importance-of-default-privacy-settings",
      videoUrl: undefined,
    },
  },
  {
    date: "Nov 2023",
    event: "DroidCon Uganda 2023",
    location: "Kampala, Uganda",
    talk: "Empowering Diverse Teams: Building an Inclusive Development Culture",
    description:
      "Lessons from leading cross-functional teams across a few different community projects, on building an engineering culture that actually supports people from different backgrounds instead of just claiming to.",
    tags: ["Diversity & Inclusion", "Team Culture", "Leadership"],
    resources: {
      slidesUrl:
        "https://speakerdeck.com/jumalaw98/empowering-diverse-teams-building-an-inclusive-development-culture",
      videoUrl: undefined,
    },
  },
  {
    date: "Sep 2023",
    event: "RenderCon Kenya 2023",
    location: "KCA University, Nairobi, Kenya",
    talk: "Building Sustainable Open Source Communities",
    description:
      "Why most open source projects lose steam once the initial excitement wears off, and what's actually kept contributors around in the ones that don't: governance that doesn't get in the way, real recognition, and maintainer workloads that don't burn people out.",
    tags: ["Open Source", "Community", "Sustainability"],
    resources: {
      slidesUrl: undefined,
      videoUrl: undefined,
    },
  },
  {
    date: "Aug 2023",
    event: "Africa's Talking Summit 2023",
    location: "UON Towers, Nairobi, Kenya",
    talk: "Building Inclusive Developer Communities",
    description:
      "What it actually takes to build a developer community that doesn't quietly filter out beginners, onboarding, mentorship, and the small habits that decide whether a newcomer sticks around or drifts off.",
    tags: ["Community", "Developer Relations", "Inclusion"],
    resources: {
      slidesUrl: undefined,
      videoUrl: undefined,
    },
  },
  {
    date: "Nov 2022",
    event: "DevFest Kisumu (DevFest Western Kenya) 2022",
    location: "UON, Kisumu, Kenya",
    talk: "Crowdsource by Google: Help Make AI Serve Everyone, Everywhere",
    description:
      "I walked through Google's Crowdsource initiative and why AI trained on narrow data ends up failing people who don't speak the 'default' language or accent and what developers in East Africa can actually do about that.",
    tags: ["AI", "Google", "Community"],
    resources: {
      slidesUrl: undefined,
      videoUrl: undefined,
    },
  },
];

// Live Sessions & Content — portfolio-content.md Section 6e.
export const liveSessionsNote = {
  host: "I host #SYTTechTalk, and I've presented on it myself too including a session on getting started and building a career in technical writing, back in July 2023.",
  sytTechTalkPlaylistUrl:
    "https://www.youtube.com/watch?v=f_qw4j-Fjs0&list=PLOBaHgIFVXS54BfHeTbLzFWxFKcrHAlpM",
  technicalWritingSessionUrl:
    "https://www.youtube.com/watch?v=Egs8ZAEM5II&list=PLOBaHgIFVXS54BfHeTbLzFWxFKcrHAlpM&index=11",
  additional:
    "I've also shown up on Twitter/X Spaces a few times, plus some YouTube session highlights worth a look.",
  topSession:
    "My top-performing session so far has been on M-PESA Integration, where I hosted with speaker Rizwan.",
  topSessionUrl:
    "https://www.youtube.com/watch?v=If6KLnU78Mo&list=PLOBaHgIFVXS54BfHeTbLzFWxFKcrHAlpM&index=17",
};
