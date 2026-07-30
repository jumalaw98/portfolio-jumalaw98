import type { Project } from "@/types/project";
import { PROJECT_IMAGES } from "@/lib/project-images";

export const nyotaBilkackWedding: Project = {
  slug: "nyota-bilkack-wedding",
  title: "N & B Wedding Website",
  status: "live",
  role: "Full Stack Developer",
  timeframe: "March 2026 - May 2026",
  stack: [
    "TypeScript",
    "React",
    "TanStack Start",
    "TanStack Router",
    "Tailwind CSS",
    "GSAP",
    "ImageKit",
  ],
  summary:
    "A cinematic wedding memorial website that tells Nyota and Bilkack's love story through immersive visuals and elegant design. The site serves as both a celebration and keepsake, featuring a chronological narrative of their wedding day with interactive gallery, embedded film, and comprehensive vendor credits.",
  featured: true,
  designCredit: "Lawrence Jumalaw",

  problem:
    "Traditional wedding websites often serve as simple photo galleries or basic event pages, lacking the emotional depth and cinematic quality needed to properly honor a couple's special day. The project needed a platform that could tell their love story through immersive visuals while maintaining professional production values and technical excellence.",
  constraints:
    "The project operated under tight time constraints (March-May 2026 timeline), required production-level performance and accessibility standards, needed to support ImageKit's CDN for efficient image delivery, and had to maintain compatibility across all modern browsers while delivering an engaging user experience on mobile devices.",
  decisions:
    "Selected TanStack Start for its file-based routing and full-stack capabilities, choosing TypeScript for type safety across the entire application. Implemented ImageKit integration for dynamic image transformations and CDN delivery, used GSAP for smooth scroll animations to create an immersive narrative experience. Adopted shadcn/ui for component consistency while customizing Tailwind CSS with design tokens for brand consistency. Chose Vercel for deployment due to its edge functions and analytics integration.",
  whatWasBuilt:
    "A production-ready wedding website featuring six narrative chapters (Getting Ready, The Church, Reception, Gifts & Traditions, The Party, Both Families) with responsive layouts and scroll-triggered animations. Implemented an interactive gallery with Masonry/Grid/Strip layouts, filtering by category, and infinite scroll. Added embedded YouTube film player with custom overlay, comprehensive vendor credits with contact information, and a sophisticated navigation system with scroll progress tracking. Built custom hooks for image optimization, error handling, and performance monitoring.",
  outcome:
    "Successfully launched on Vercel with production deployment, achieving optimal Core Web Vitals and fast load times through ImageKit CDN optimization. The site delivers a seamless, immersive experience that has been well-received by users, with all wedding day images properly categorized and accessible. Implemented comprehensive error boundaries, accessibility features (ARIA labels, reduced motion support), and SEO optimization with structured data.",
  reflection:
    "The project taught me the importance of balancing technical excellence with emotional storytelling in web development. I learned to optimize image delivery at scale while maintaining quality, and how to create performant animations that enhance rather than distract from the content. The experience reinforced the value of component-driven architecture for maintainability and the importance of thorough testing for production reliability. I would now prioritize more aggressive caching strategies and implement additional performance monitoring for future deployments.",

  liveUrl: "https://nyotawedsbilkack.vercel.app/",
  screenshots: [...PROJECT_IMAGES.projects["nyota-bilkack-wedding"]],
};
