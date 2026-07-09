// Field names verified against Hashnode's current Public API (gql.hashnode.com)
// docs and example integrations. Kept deliberately conservative — we don't
// depend on any field that isn't consistently documented (e.g. no unverified
// `tableOfContents` schema field; TOC is built client-side instead).

export const POST_SUMMARY_FIELDS = `
  id
  slug
  title
  subtitle
  brief
  publishedAt
  readTimeInMinutes
  url
  coverImage {
    url
  }
  tags {
    name
    slug
  }
  author {
    name
    username
    profilePicture
  }
`;

export const POSTS_QUERY = `
  query Posts($host: String!, $first: Int!, $after: String) {
    publication(host: $host) {
      title
      posts(first: $first, after: $after) {
        edges {
          node {
            ${POST_SUMMARY_FIELDS}
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const POST_BY_SLUG_QUERY = `
  query PostBySlug($host: String!, $slug: String!) {
    publication(host: $host) {
      post(slug: $slug) {
        ${POST_SUMMARY_FIELDS}
        content {
          html
        }
        ogMetaData {
          image
        }
      }
    }
  }
`;
