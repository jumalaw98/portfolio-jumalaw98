// Placeholder imagery only, sourced from Unsplash's free CDN so pages render
// realistically before real photos/screenshots are dropped into /public.
// Swap every entry here for a real asset path before launch — nothing else
// needs to change since components read from this file.
//
// TODO: replace all of these with real images:
//   - headshot -> public/images/headshot.jpg
//   - project screenshots -> public/images/projects/<slug>/*
//   - blog cover images -> come live from Hashnode once HASHNODE_PUBLICATION_HOST is set

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PLACEHOLDER_IMAGES = {
  headshot: u("photo-1633332755192-727a05c4013d", 800), // developer portrait, placeholder
  projects: {
    "africa-devops-summit": [
      u("photo-1591115765373-5207764f72e7"), // conference crowd
      u("photo-1531482615713-2afd69097998"), // laptop/code screen
    ],
    "nairobi-devops-community": [
      u("photo-1517048676732-d65bc937f952"), // community meetup
      u("photo-1522071820081-009f0129c71c"), // code on screen
    ],
    "pretalx-azure": [
      u("photo-1558494949-ef010cbdcc31"), // server room
      u("photo-1518770660439-4636190af475"), // terminal/code
    ],
  },
  blogFallback: [
    u("photo-1516321318423-f06f85e504b3", 800),
    u("photo-1461749280684-dccba630e2f6", 800),
    u("photo-1487058792275-0ad4aaf24ca7", 800),
  ],
  speaking: [
    u("photo-1540575467063-178a50c2df87", 800), // conference stage/speaker
    u("photo-1475721027785-f74eccf877e2", 800), // audience/tech talk
    u("photo-1591115765373-5207764f72e7", 800), // conference crowd
    u("photo-1560439514-4e9645039924", 800), // panel/presentation
    u("photo-1505373877841-8d25f7d46678", 800), // meetup/talk
  ],
} as const;
