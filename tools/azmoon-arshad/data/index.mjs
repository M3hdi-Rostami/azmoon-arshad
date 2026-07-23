import general from "./general.mjs";
import computer from "./computer.mjs";
import management from "./management.mjs";
import psychology from "./psychology.mjs";
import law from "./law.mjs";

export const questionBank = {
  version: "1.0.0",
  groups: [general, computer, management, psychology, law],
};

export function validateQuestionBank(bank) {
  const errors = [];
  const seenExamIds = new Set();
  for (const group of bank.groups) {
    if (!group.id || !group.title) errors.push(`گروه بدون شناسه/عنوان: ${JSON.stringify(group.id)}`);
    for (const exam of group.exams ?? []) {
      if (seenExamIds.has(exam.id)) errors.push(`شناسه آزمون تکراری: ${exam.id}`);
      seenExamIds.add(exam.id);
      const readingIds = new Set((exam.readings ?? []).map((r) => r.id));
      (exam.questions ?? []).forEach((q, i) => {
        const label = `${exam.id}#${i + 1}`;
        if (!q.q || typeof q.q !== "string") errors.push(`${label}: متن سؤال نامعتبر`);
        if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${label}: باید دقیقاً ۴ گزینه داشته باشد`);
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`${label}: پاسخ صحیح نامعتبر`);
        if (!q.explanation) errors.push(`${label}: پاسخ تشریحی ندارد`);
        if (!q.subject) errors.push(`${label}: درس مشخص نشده`);
        if (q.reading && !readingIds.has(q.reading)) errors.push(`${label}: ارجاع به متن ناموجود ${q.reading}`);
      });
      if ((exam.questions ?? []).length === 0) errors.push(`${exam.id}: آزمون بدون سؤال`);
    }
  }
  return errors;
}
