/**
 * Buffer API client — posts text to a configured social channel.
 *
 * Uses Buffer's GraphQL `createPost` mutation.  The API endpoint is always
 * the root (`POST https://api.buffer.com`) with a JSON body containing
 * the query and variables.  Authentication is via Bearer token.
 *
 * Rate limit: 100 requests per 15 minutes per client.
 *
 * @see https://developers.buffer.com
 */

export interface BufferPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

interface CreatePostVariables {
  text: string;
  channelId: string;
  schedulingType: "automatic";
  mode: "addToQueue" | "customScheduled";
  saveToDraft?: boolean;
  dueAt?: string;
}

const BUFFER_API = "https://api.buffer.com";
const CREATE_POST_MUTATION = `
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess {
      post {
        id
        text
        status
        dueAt
      }
    }
    ... on MutationError {
      message
    }
  }
}
`;

/**
 * Post text to a Buffer channel.
 *
 * By default posts are saved as drafts (`saveToDraft: true`) so they can be
 * reviewed before going live.  Pass `{ saveToDraft: false }` in `opts` to skip
 * the draft and queue the post for the channel's next available publishing slot.
 *
 * This function returns a result object rather than throwing on API errors,
 * so the caller can handle a per-channel failure without aborting other
 * channels.
 */
export async function postToBuffer(
  text: string,
  channelId: string,
  opts?: { saveToDraft?: boolean; dueAt?: string },
): Promise<BufferPostResult> {
  const apiKey = process.env.BUFFER_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      error: "BUFFER_API_KEY is required. Set it in your environment or .env.local.",
    };
  }

  const variables: CreatePostVariables = {
    text,
    channelId,
    schedulingType: "automatic",
    mode: opts?.dueAt ? "customScheduled" : "addToQueue",
    saveToDraft: opts?.saveToDraft ?? true,
  };

  if (opts?.dueAt) {
    variables.dueAt = opts.dueAt;
  }

  try {
    const response = await fetch(BUFFER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: CREATE_POST_MUTATION,
        variables: { input: variables },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        success: false,
        error: `Buffer HTTP ${response.status}: ${body}`,
      };
    }

    const json = (await response.json()) as {
      data?: Record<string, unknown>;
      errors?: Array<{ message: string }>;
    };

    // Top-level GraphQL errors
    if (json.errors?.[0]) {
      return { success: false, error: json.errors[0].message };
    }

    const result = json.data?.createPost as Record<string, unknown> | undefined;

    if (!result) {
      return { success: false, error: "Buffer returned null/undefined for createPost" };
    }

    // Typed mutation error
    if (result?.message) {
      return { success: false, error: result.message as string };
    }

    // Success
    const post = result?.post as Record<string, unknown> | undefined;
    return {
      success: true,
      postId: (post?.id as string) ?? undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: `Buffer request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
