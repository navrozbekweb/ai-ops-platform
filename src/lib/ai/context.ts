import "server-only";
import { analytics, listDocs } from "@/lib/data/sections";
import { listTasks, statsFor, teamOf, todayIso } from "@/lib/data/service";
import type { Person } from "@/lib/data/types";

const MAX_TASKS = 40;
const MAX_DOCS = 30;

/** Foydalanuvchi kiritgan matn (sarlavha, ism) bitta qatorda va qisqa bo'lsin: promptni buzmasligi uchun. */
const clean = (value: string, max = 120) =>
  value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/**
 * Modelga beriladigan ma'lumotlar. Faqat so'rayotgan foydalanuvchi o'zi ko'ra oladigan narsalar
 * (listTasks/listDocs allaqachon rol bo'yicha filtrlangan), shuning uchun AI orqali boshqaning
 * yopiq ma'lumotiga yetib bo'lmaydi.
 */
export function buildContext(actor: Person): string {
  const today = todayIso();
  const stats = statsFor(actor);
  const lines: string[] = [`Today: ${today}`];

  lines.push(
    `Summary: active tasks assigned to the user=${stats.myTasks}, overdue among visible tasks=${stats.late}, ` +
      `waiting for the user's approval=${stats.pending}.`,
  );

  const tasks = listTasks(actor);
  lines.push(
    `Visible tasks (${tasks.length}${tasks.length > MAX_TASKS ? `, first ${MAX_TASKS}` : ""}):`,
  );
  for (const task of tasks.slice(0, MAX_TASKS)) {
    const overdue = task.status !== "done" && task.due < today ? " OVERDUE" : "";
    lines.push(
      `- "${clean(task.title)}" | status=${task.status} | priority=${task.priority} | ` +
        `due=${task.due}${overdue} | assignee=${clean(task.assigneeName, 60)}`,
    );
  }

  const docs = listDocs(actor);
  lines.push(
    `Visible documents (${docs.length}${docs.length > MAX_DOCS ? `, first ${MAX_DOCS}` : ""}):`,
  );
  for (const doc of docs.slice(0, MAX_DOCS)) {
    lines.push(
      `- "${clean(doc.title)}" | type=${doc.category} | ${doc.shared ? "shared" : "private"} | ` +
        `author=${clean(doc.ownerName, 60)}`,
    );
  }

  if (actor.role === "manager") {
    const team = teamOf(actor);
    lines.push(
      `Team members (${team.length}): ${team.map((p) => clean(p.name, 60)).join(", ") || "none"}`,
    );
  }

  if (actor.role !== "employee") {
    const report = analytics(actor);
    if (report.ok) {
      const { totals, byDept } = report.value;
      lines.push(
        `Company analytics: tasks=${totals.tasks}, done=${totals.done}, active=${totals.open}, ` +
          `overdue=${totals.late}, completion=${totals.rate}%`,
      );
      lines.push(
        `By department: ${byDept.map((d) => `${clean(d.dept, 40)} (active ${d.open}, done ${d.done})`).join("; ")}`,
      );
    }
  }

  return lines.join("\n");
}
