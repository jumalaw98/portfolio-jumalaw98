export interface Certification {
  name: string;
  issuer: string;
  year?: string;
}

// Shown prominently on About — lead with these, per brand-profile honesty
// boundaries: curated, not a flat wall of every badge earned.
export const leadCertifications: Certification[] = [
  { name: "Google Cybersecurity Certification", issuer: "Coursera", year: "2023/2024" },
  { name: "Google Project Management Certification", issuer: "Coursera", year: "2023" },
  { name: "Cisco Ethical Hacker", issuer: "Cisco x CyberShujaa, USIU-Africa" },
  {
    name: "EC-Council Ethical Hacking Essentials",
    issuer: "CyberShujaa, USIU-Africa, Seriana",
    year: "2024",
  },
];

// Collapsed under "+16 more, view on Credly" link on the About page.
export const additionalCertifications: Certification[] = [
  { name: "Virtual Assistant Program", issuer: "ALX Africa", year: "2024" },
  { name: "AiCE Program", issuer: "ALX Africa" },
  { name: "Meta Certified Digital Marketing Associate", issuer: "Meta" },
  { name: "Technical Writing Bootcamp", issuer: "Writers Tech Hub", year: "2024" },
  {
    name: "Entrepreneurship and Business Development",
    issuer: "CyberShujaa",
    year: "2024",
  },
  {
    name: "Advanced Cybersecurity Training for Teachers",
    issuer: "Commonwealth of Learning",
    year: "2024",
  },
  {
    name: "Cybersecurity Training for Teachers",
    issuer: "Commonwealth of Learning",
    year: "2024",
  },
  { name: "CIPIT's Data Protection Course", issuer: "Strathmore", year: "2024" },
  {
    name: "Introduction to Cybersecurity Bootcamp",
    issuer: "CyberTalents",
    year: "2023/2024",
  },
  {
    name: "Google Digital Marketing & E-commerce Certification",
    issuer: "Coursera",
    year: "2023",
  },
  {
    name: "Inclusive Open Source Community Orientation LFC102",
    issuer: "The Linux Foundation",
    year: "2023",
  },
  { name: "Huduma Whitebox Entrepreneurship Training", issuer: "Huduma", year: "2023" },
  { name: "Google Hustle Academy Bootcamp Program", issuer: "Google", year: "2023" },
  { name: "Responsive Web Development", issuer: "FreeCodeCamp", year: "2022" },
  { name: "Web Development Program Bootcamp", issuer: "eMobilis", year: "2022" },
  {
    name: "Generation Digital Customer Service Training",
    issuer: "Generation Kenya",
    year: "2021",
  },
  { name: "Transcription and Content Writing", issuer: "Ajira Digital Program", year: "2021" },
];

export const CREDLY_PROFILE_URL = "https://www.credly.com/users/jumalaw98/badges";
