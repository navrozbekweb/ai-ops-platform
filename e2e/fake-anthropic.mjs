// Sinov uchun soxta Anthropic API. Haqiqiy tarmoqqa chiqmaydi.
// POST /v1/messages: kalitni tekshiradi, so'rovni eslab qoladi, "FAKE_REPLY: ..." qaytaradi.
// GET /last: oxirgi so'rovning tanasi (testlar nima yuborilganini tekshiradi).
// Savolda "FAIL" bo'lsa, 500 qaytaradi.
import { createServer } from "node:http";

const PORT = Number(process.env.FAKE_ANTHROPIC_PORT ?? 3101);
let last = null;

createServer((req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (req.method === "GET" && req.url === "/last") return send(200, last ?? {});

  if (req.method === "POST" && req.url === "/v1/messages") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (req.headers["x-api-key"] !== "test-key") {
        return send(401, { type: "error", error: { type: "authentication_error" } });
      }
      const body = JSON.parse(raw);
      last = { ...body, _headers: { version: req.headers["anthropic-version"] } };
      const question = body.messages.at(-1)?.content ?? "";
      if (question.includes("FAIL")) return send(500, { type: "error" });
      return send(200, {
        type: "message",
        role: "assistant",
        content: [{ type: "text", text: `FAKE_REPLY: ${question}` }],
      });
    });
    return;
  }
  send(404, {});
}).listen(PORT, () => console.log(`fake anthropic on ${PORT}`));
