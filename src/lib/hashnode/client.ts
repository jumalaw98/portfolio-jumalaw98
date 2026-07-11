const HASHNODE_ENDPOINT = "https://gql.hashnode.com";

export class HashnodeApiError extends Error {
  constructor(
    message: string,
    public readonly errors?: unknown,
  ) {
    super(message);
    this.name = "HashnodeApiError";
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

interface RequestOptions {
  /** Next.js ISR revalidation window in seconds. */
  revalidate?: number;
  /** Next.js cache tags, for on-demand revalidation. */
  tags?: string[];
}

/**
 * Sends a POST request to the Hashnode Public API (gql.hashnode.com).
 * No auth token is needed — every query used in this app reads public data.
 */
export async function hashnodeRequest<
  T,
  V extends Record<string, unknown> = Record<string, unknown>,
>(query: string, variables?: V, options: RequestOptions = {}): Promise<T> {
  const { revalidate = 3600, tags } = options;

  const response = await fetch(HASHNODE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate, tags },
  });

  if (!response.ok) {
    throw new HashnodeApiError(`Hashnode API request failed with status ${response.status}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new HashnodeApiError(json.errors.map((e) => e.message).join("; "), json.errors);
  }

  if (!json.data) {
    throw new HashnodeApiError("Hashnode API returned no data.");
  }

  return json.data;
}
