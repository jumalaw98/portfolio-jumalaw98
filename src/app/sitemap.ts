import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { mvpProjects } from "@/content/projects";
import { getAllPosts, isHashnodeConfigured } from "@/lib/hashnode";
import { placeholderBlogPosts } from "@/content/blog-placeholder";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/projects",
    "/about",
    "/contact",
    "/community",
    "/blog",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const projectRoutes = mvpProjects.map((project) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    lastModified: new Date(),
  }));

  const livePosts = await getAllPosts();
  const blogPosts = !isHashnodeConfigured() || livePosts.length === 0
    ? placeholderBlogPosts
    : livePosts;

  const blogRoutes = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
  }));

  return [...staticRoutes, ...projectRoutes, ...blogRoutes];
}
