export type ExpectedAnswers = {
  institution: string;
  representative: string;
  email: string;
  phone: string;
  county: string;
  locality: string;
  projectTitle: string;
  amount: string;
  score: string;
};

export const EXPECTED_FIELDS: Array<{
  key: keyof ExpectedAnswers;
  label: string;
}> = [
  { key: "institution", label: "Numele instituției" },
  { key: "representative", label: "Numele reprezentantului legal" },
  { key: "email", label: "Adresa de e-mail" },
  { key: "phone", label: "Număr de telefon" },
  { key: "county", label: "Județ" },
  { key: "locality", label: "Localitate" },
  { key: "projectTitle", label: "Titlul proiectului" },
  { key: "amount", label: "Valoarea solicitată (euro)" },
  { key: "score", label: "Punctaj prescorat" },
];

export const EMPTY_EXPECTED: ExpectedAnswers = {
  institution: "",
  representative: "",
  email: "",
  phone: "",
  county: "",
  locality: "",
  projectTitle: "",
  amount: "",
  score: "",
};

export const EXPECTED_ANSWERS_KEY = "adr_nv_expected_answers";
export const SKIP_VALIDATION_KEY = "adr_nv_skip_validation";

export function getExpectedAnswers(): ExpectedAnswers {
  if (typeof window === "undefined") return { ...EMPTY_EXPECTED };
  try {
    const raw = localStorage.getItem(EXPECTED_ANSWERS_KEY);
    if (!raw) return { ...EMPTY_EXPECTED };
    return { ...EMPTY_EXPECTED, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_EXPECTED };
  }
}

export function saveExpectedAnswers(answers: ExpectedAnswers) {
  localStorage.setItem(EXPECTED_ANSWERS_KEY, JSON.stringify(answers));
}

export function getSkipValidation(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SKIP_VALIDATION_KEY) === "1";
}

export function saveSkipValidation(skip: boolean) {
  localStorage.setItem(SKIP_VALIDATION_KEY, skip ? "1" : "0");
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function validateAgainstExpected(
  form: ExpectedAnswers,
  expected: ExpectedAnswers
): string[] {
  if (getSkipValidation()) return [];

  const errors: string[] = [];
  for (const { key, label } of EXPECTED_FIELDS) {
    const want = expected[key];
    if (!want.trim()) continue;
    if (normalize(form[key]) !== normalize(want)) {
      errors.push(`„${label}” nu corespunde valorii setate în admin.`);
    }
  }
  return errors;
}
