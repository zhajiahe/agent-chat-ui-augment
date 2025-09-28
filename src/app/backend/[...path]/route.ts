import { NextRequest } from "next/server";

export const runtime = "edge";

async function handle(req: NextRequest): Promise<Response> {
  const targetBase = process.env.BACKEND_API_URL || "http://localhost:8000";
  const url = new URL(req.url);
  // Strip "/backend" prefix
  const suffix = url.pathname.replace(/^\/backend/, "");
  const target = `${targetBase}${suffix}${url.search}`;

  // Build safe forward headers
  const forwardHeaders = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) forwardHeaders.set("content-type", ct);
  const auth = req.headers.get("authorization");
  if (auth) forwardHeaders.set("authorization", auth);

  // Ensure body is materialized for non-GET methods
  let body: BodyInit | undefined = undefined;
  if (!(["GET", "HEAD"].includes(req.method))) {
    // Pass through as text to preserve JSON exactly
    const txt = await req.text();
    body = txt;
  }

  const init: RequestInit = { method: req.method, headers: forwardHeaders, body };

  const res = await fetch(target, init);
  const resHeaders = new Headers(res.headers);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: resHeaders });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;


