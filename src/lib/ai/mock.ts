import "server-only";
import { listTasks, statsFor, teamOf, todayIso } from "@/lib/data/service";
import { listDocs } from "@/lib/data/sections";
import type { Person } from "@/lib/data/types";

/**
 * MOCK AI yordamchi: kalit so'zlar bo'yicha foydalanuvchining haqiqiy (xotiradagi) ma'lumotlaridan
 * javob tuzadi. Haqiqiy model ulanganda shu fayl LLM chaqiruviga almashtiriladi.
 * Matnlar bu yerda emas: faqat tarjima kaliti va parametrlar qaytadi.
 */
export type AiReply = { key: string; params: Record<string, string | number> };

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

export function aiReply(actor: Person, message: string): AiReply {
  const text = message.toLowerCase();
  const stats = statsFor(actor);

  if (
    has(text, [
      "kechik",
      "muddati o'tgan",
      "muddati o‘tgan",
      "просроч",
      "overdue",
      "late",
    ])
  ) {
    const today = todayIso();
    const late = listTasks(actor).filter((t) => t.status !== "done" && t.due < today);
    if (late.length === 0) return { key: "noLate", params: {} };
    return {
      key: "late",
      params: {
        count: late.length,
        list: late
          .slice(0, 3)
          .map((t) => `«${t.title}»`)
          .join(", "),
      },
    };
  }
  if (has(text, ["tasdiq", "утверд", "approv"])) {
    return { key: "approvals", params: { count: stats.pending } };
  }
  if (has(text, ["vazifa", "задач", "task"])) {
    return { key: "tasks", params: { open: stats.myTasks, late: stats.late } };
  }
  if (has(text, ["hujjat", "документ", "document"])) {
    return { key: "docs", params: { count: listDocs(actor).length } };
  }
  if (has(text, ["jamoa", "команд", "team"]) && actor.role === "manager") {
    return { key: "team", params: { count: teamOf(actor).length } };
  }
  if (has(text, ["yordam", "помощ", "help", "nima qila", "умеешь"])) {
    return { key: "help", params: {} };
  }
  if (has(text, ["salom", "assalom", "привет", "здравств", "hello", "hi "])) {
    return { key: "greeting", params: { name: actor.name.split(" ")[0] ?? "" } };
  }
  return { key: "fallback", params: {} };
}
