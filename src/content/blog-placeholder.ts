import type { BlogPostDetail } from "@/types/blogPost";
import { PROJECT_IMAGES } from "@/lib/project-images";

// Placeholder-only demo posts, shown when HASHNODE_PUBLICATION_HOST isn't set
// yet (see lib/hashnode/posts.ts) so /blog and /blog/[slug] aren't empty
// during development. These are NOT real posts — swap to live Hashnode data
// by setting the env var. Content includes real HTML markup (headings, code
// blocks, lists) so the full reading experience — TOC, syntax highlighting,
// progress bar — can be exercised end-to-end before Hashnode is connected.
const AUTHOR = {
  name: "Lawrence Juma",
  username: "jumalaw98",
  profilePictureUrl: "https://ik.imagekit.io/lawz/law/jumalaw98.jpg",
};

export const placeholderBlogPosts: BlogPostDetail[] = [
  {
    slug: "placeholder-devops-lessons",
    title: "[Placeholder] Lessons from deploying a self-hosted CFP on Azure",
    subtitle: "What migrating off Papercall taught me about cost, control, and ownership",
    brief:
      "A demo post standing in for real Hashnode content — connect HASHNODE_PUBLICATION_HOST to replace this with a live feed.",
    coverImageUrl: PROJECT_IMAGES.blogFallback[0],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    readTimeInMinutes: 6,
    url: "https://jumalaw98.hashnode.dev/",
    tags: [
      { name: "DevOps", slug: "devops" },
      { name: "Azure", slug: "azure" },
    ],
    author: AUTHOR,
    ogImageUrl: PROJECT_IMAGES.blogFallback[0],
    contentHtml: `
      <p>This is placeholder content standing in for a real Hashnode article. Once <code>HASHNODE_PUBLICATION_HOST</code> is set, this page renders your actual published HTML instead.</p>
      <h2 id="the-problem">The problem</h2>
      <p>Paid CFP platforms are fine until you want full control over submission workflows and scheduling — and until the invoices start adding up.</p>
      <h2 id="the-migration">The migration</h2>
      <p>Self-hosting Pretalx on existing Azure credits meant zero new infrastructure spend, at the cost of taking on operational ownership.</p>
      <pre><code class="language-bash"># example deployment step
docker compose up -d --build</code></pre>
      <h2 id="what-id-do-differently">What I'd do differently</h2>
      <ul>
        <li>Set up monitoring before launch, not after</li>
        <li>Automate backups from day one</li>
        <li>Document the rollback path before you need it</li>
      </ul>
      <h2 id="takeaways">Takeaways</h2>
      <p>Ownership is a trade — more control, more responsibility. Worth it when the cost savings and flexibility outweigh the operational overhead.</p>
    `,
  },
  {
    slug: "placeholder-community-building",
    title: "[Placeholder] What running a 200-person conference taught me about shipping code",
    subtitle: "Event ops and software delivery have more in common than you'd think",
    brief:
      "A demo post standing in for real Hashnode content — connect HASHNODE_PUBLICATION_HOST to replace this with a live feed.",
    coverImageUrl: PROJECT_IMAGES.blogFallback[1],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    readTimeInMinutes: 5,
    url: "https://jumalaw98.hashnode.dev/",
    tags: [
      { name: "Community", slug: "community" },
      { name: "Engineering", slug: "engineering" },
    ],
    author: AUTHOR,
    ogImageUrl: PROJECT_IMAGES.blogFallback[1],
    contentHtml: `
      <p>Placeholder article — swap this out once your Hashnode publication is connected.</p>
      <h2 id="deadlines-that-dont-move">Deadlines that don't move</h2>
      <p>A conference date is immovable in a way most software deadlines aren't. That constraint teaches triage fast.</p>
      <h2 id="fast-honest-feedback">Fast, honest feedback</h2>
      <p>Running a community means you hear immediately when something doesn't work — there's no staging environment for a live event.</p>
      <h2 id="the-same-skill-twice">The same skill, twice</h2>
      <p>Planning for failure, communicating under pressure, and shipping on a deadline — these show up identically whether you're organizing a summit or a sprint.</p>
    `,
  },
  {
    slug: "placeholder-react-nextjs",
    title: "[Placeholder] Notes on moving from React to Next.js for real production sites",
    subtitle: "SSR, ISR, and the App Router in practice, not just in docs",
    brief:
      "A demo post standing in for real Hashnode content — connect HASHNODE_PUBLICATION_HOST to replace this with a live feed.",
    coverImageUrl: PROJECT_IMAGES.blogFallback[2],
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    readTimeInMinutes: 7,
    url: "https://jumalaw98.hashnode.dev/",
    tags: [
      { name: "Next.js", slug: "nextjs" },
      { name: "React", slug: "react" },
    ],
    author: AUTHOR,
    ogImageUrl: PROJECT_IMAGES.blogFallback[2],
    contentHtml: `
      <p>Placeholder article content for local development and design review.</p>
      <h2 id="why-next">Why Next.js</h2>
      <p>SSR and ISR solved real problems a plain React SPA couldn't for SEO-sensitive, content-driven sites.</p>
      <pre><code class="language-typescript">export const revalidate = 3600; // ISR window in seconds</code></pre>
      <h2 id="the-app-router">The App Router</h2>
      <p>Server Components by default meant shipping meaningfully less client-side JavaScript without changing how the app was structured.</p>
      <h2 id="lessons">Lessons</h2>
      <p>Data fetching close to where it's used, colocated with the component that needs it, made the codebase easier to reason about than a single global fetch layer.</p>
    `,
  },
];
