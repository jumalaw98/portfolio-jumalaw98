export interface HashnodeTag {
  name: string;
  slug: string;
}

export interface HashnodeAuthor {
  name: string;
  username: string;
  profilePicture: string | null;
}

export interface HashnodeCoverImage {
  url: string;
}

export interface HashnodePostSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  brief: string;
  publishedAt: string;
  readTimeInMinutes: number;
  url: string;
  coverImage: HashnodeCoverImage | null;
  tags: HashnodeTag[] | null;
  author: HashnodeAuthor;
}

export interface HashnodePostFull extends HashnodePostSummary {
  content: { html: string };
  ogMetaData: { image: string | null } | null;
}

export interface HashnodePageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface PostsQueryResponse {
  publication: {
    title: string;
    posts: {
      edges: { node: HashnodePostSummary }[];
      pageInfo: HashnodePageInfo;
    };
  } | null;
}

export interface PostBySlugQueryResponse {
  publication: {
    post: HashnodePostFull | null;
  } | null;
}
