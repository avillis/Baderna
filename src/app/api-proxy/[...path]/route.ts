/**
 * Proxy local para a API de produção — só usado em dev (localhost).
 * Contorna o bloqueio de CORS do browser ao fazer as chamadas server-side.
 */
const API_BASE = "https://api.bdrn.com.br/api";

async function handler(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(req.url);
  const target = `${API_BASE}/${path.join("/")}${url.search}`;

  const headers = new Headers();
  // Repassa headers relevantes (auth, content-type, accept)
  for (const [key, value] of req.headers.entries()) {
    if (["authorization", "content-type", "accept", "x-requested-with"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  const body = req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined;

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const resHeaders = new Headers();
  for (const [key, value] of res.headers.entries()) {
    if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
      resHeaders.set(key, value);
    }
  }

  return new Response(res.body, {
    status: res.status,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
