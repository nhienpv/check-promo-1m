export default async (request, context) => {
  const inUrl = new URL(request.url);
  // chỉ nhận /backend-api/*
  if (!inUrl.pathname.startsWith("/backend-api/")) {
    return new Response("Not handled", { status: 404 });
  }

  // chuyển sang upstream
  const outUrl = new URL(inUrl.toString());
  outUrl.host = "chatgpt.com";        // thử "chat.openai.com" nếu cần
  outUrl.protocol = "https:";

  // clone headers và chỉnh hợp lệ
  const h = new Headers(request.headers);
  h.set("origin", "https://chatgpt.com");
  h.set("referer", "https://chatgpt.com/");
  if (!h.has("user-agent")) h.set("user-agent", "Mozilla/5.0");
  if (!h.has("accept")) h.set("accept", "application/json, */*");

  // proxy thẳng
  const resp = await fetch(outUrl.toString(), {
    method: request.method,
    headers: h,
    body: request.body,
    redirect: "manual",
  });

  // trả nguyên response (same-origin nên khỏi CORS)
  return new Response(resp.body, {
    status: resp.status,
    headers: resp.headers,
  });
};
