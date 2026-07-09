export interface EducationEntry {
  credential: string;
  institution: string;
  dates: string;
  note?: string;
}

// Pulled from the same confirmed facts as content/timeline.ts (Section 3a of
// portfolio-content.md) — kept here as a compact, scannable subset for
// visitors specifically looking for "Education" rather than the full career
// narrative. Not a re-narration: same facts, different (shorter) framing.
export const education: EducationEntry[] = [
  {
    credential: "Diploma in Electrical and Electronics Engineering (Power Option)",
    institution: "The Kisumu National Polytechnic",
    dates: "2015–2019",
  },
  {
    credential: "Responsive Web Development",
    institution: "FreeCodeCamp",
    dates: "2022",
    note: "Self-directed, alongside the eMobilis bootcamp below",
  },
  {
    credential: "Web Development Bootcamp",
    institution: "eMobilis Mobile Technology Academy",
    dates: "2022",
  },
];
