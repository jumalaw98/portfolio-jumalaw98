const u = (url: string, w = 1200) =>
  `https://ik.imagekit.io/lawz/${url}?tr=w-${w},q-80,fo-auto`;

export const PROJECT_IMAGES = {
  projects: {
    "africa-devops-summit": [
      u("projects/ads.webp"),
      u("projects/ads1_RL23GMMJd.webp"),
    ],
    "nairobi-devops-community": [
      u("projects/ndc01.webp"),
      u("projects/ndc3.webp"),
    ],
    "pretalx-azure": [
      u("projects/px.webp"),
    ],
  },
  blogFallback: [
    u("blog/blog-1.jpg", 800),
    u("blog/blog-2.jpg", 800),
    u("blog/blog-3.jpg", 800),
  ],
} as const;
