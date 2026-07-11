export interface TimelineEntry {
  stage: string;
  institution: string;
  dates: string;
  description: string;
  parallelStart?: boolean; // flags the 2022 simultaneous dev + community start
}

// Confirmed content — portfolio-content.md Section 3a.
// Core narrative: developer journey and community leadership both began in
// 2022, running in parallel from the start — not a sequential pivot.
export const timeline: TimelineEntry[] = [
  {
    stage: "Electrical Engineering diploma",
    institution: "The Kisumu National Polytechnic",
    dates: "2015–2019",
    description: "Diploma in Electrical and Electronics Engineering (Power Option).",
  },
  {
    stage: "Engineering internship",
    institution: "Mumias Sugar Company",
    dates: "Jan–Apr 2016",
    description:
      "Installed power systems, managed SCADA and motor-power control, programmed logic control systems.",
  },
  {
    stage: "Customer service era",
    institution: "Golden Connection Cyber, Kisumu",
    dates: "2020–2023",
    description:
      "Customer care attendant — digital support, business operations, assisted clients with government platforms (KRA, NTSA, NHIF).",
  },
  {
    stage: "WordPress work (overlaps)",
    institution: "A Pack A Month (remote)",
    dates: "2021–2022",
    description: "Website management via Elementor, SEO via Yoast, social media integration.",
  },
  {
    stage: "Community leadership begins",
    institution: "GDSC The Kisumu National Polytechnic",
    dates: "2022–2023",
    description: "Technical Lead, Core Team.",
    parallelStart: true,
  },
  {
    stage: "Developer journey begins",
    institution: "FreeCodeCamp + eMobilis Mobile Technology Academy",
    dates: "2022",
    description: "Responsive Web Development (FreeCodeCamp) + Web Development Bootcamp (eMobilis).",
    parallelStart: true,
  },
  {
    stage: "Community leadership continues",
    institution: "SpaceYaTech Community",
    dates: "2022–ongoing",
    description: "Community Manager & Social Media Manager.",
  },
  {
    stage: "Community leadership continues",
    institution: "Nairobi DevOps Community",
    dates: "2023–ongoing",
    description:
      "Community Manager & Events Manager (role deepened to Program Coordinator/Project Manager in 2025).",
  },
  {
    stage: "Technical writing leadership",
    institution: "SheCodeAfrica Nairobi",
    dates: "[TBD — start year]–2024", // TODO: confirm start year with Lawrence
    description:
      "Technical Writer Lead — led the technical writing team, created the content calendar.",
  },
  {
    stage: "Community leadership continues",
    institution: "WesternCyberHub",
    dates: "2024",
    description: "Community Manager & Editorial Lead.",
  },
  {
    stage: "Community leadership continues",
    institution: "InfoSec365",
    dates: "2024–ongoing",
    description: "Co-founder & Community Manager.",
  },
];
