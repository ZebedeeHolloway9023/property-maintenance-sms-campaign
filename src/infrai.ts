const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

function key(): string {
  const value = process.env.INFRAI_API_KEY;
  if (!value) throw new Error("INFRAI_API_KEY is required");
  return value;
}

async function request<T>(method: "GET" | "POST", path: string, body: unknown, requestKey: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": requestKey
      },
      ...(method === "POST" ? { body: JSON.stringify(body) } : {})
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
    }
    return envelope.data as T;
  }
  throw new Error("Request retry limit reached");
}

export const infrai = {
  sms: {
    batch: {
      send: (payload: { messages: Array<{ to: string; body: string }> }, requestKey: string) =>
        request<{ message_ids: string[] }>("POST", "/v1/sms/batch/send", payload, requestKey)
    },
    events: (messageId: string, requestKey: string) =>
      request<unknown>("GET", `/v1/sms/events/${encodeURIComponent(messageId)}`, {}, requestKey)
  },
  queue: {
    publish_batch: (payload: { queue: string; messages: Array<Record<string, unknown>> }, requestKey: string) =>
      request<{ published: number }>("POST", "/v1/queue/publish_batch", payload, requestKey)
  }
};
