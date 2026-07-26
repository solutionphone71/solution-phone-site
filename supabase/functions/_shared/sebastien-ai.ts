export type AIAnswer = {
  intent: "repair" | "price" | "stock" | "shop_info" | "other";
  answer: string;
  needs_human: boolean;
  suggested_question: string | null;
  safety: string | null;
};

const SAFETY_SIGNAL = /\b(?:chauff\w*|br[uû]l\w*|fum\w*|odeur\w*|gonfl\w*|liquide\w*|mouill\w*|oxyd\w*|incendi\w*|siffl\w*|fuit\w*)\b/i;

export function alignAIAnswerWithQuestion(
  value: AIAnswer,
  customerQuestion: string,
): AIAnswer {
  const questionHasSafetySignal = SAFETY_SIGNAL.test(customerQuestion);
  const answerHasSafetySignal = SAFETY_SIGNAL.test(
    `${value.safety || ""} ${value.answer}`,
  );

  // Une consigne d'urgence sans aucun signal correspondant dans la question
  // est une réponse hors sujet. On la remplace par deux vérifications fermées
  // et sûres au lieu de l'afficher ou d'alerter inutilement l'équipe.
  if (
    value.intent === "repair" &&
    answerHasSafetySignal &&
    !questionHasSafetySignal
  ) {
    return {
      intent: "repair",
      answer:
        "Commencez par redémarrer le téléphone, puis retirez la coque ou les accessoires et vérifiez si le problème revient.",
      needs_human: false,
      suggested_question: null,
      safety: null,
    };
  }

  return value;
}

const ALLOWED_INTENTS = new Set<AIAnswer["intent"]>([
  "repair",
  "price",
  "stock",
  "shop_info",
  "other",
]);
const FORBIDDEN_CLAIMS = [
  /\b\d+(?:[.,]\d+)?\s*(?:€|euros?)(?:\s|[.,;:!?]|$)/i,
  /\b(?:en stock|disponible en boutique|pi[eè]ce disponible)\b/i,
  /\b(?:r[eé]par[eé]|pr[eê]t)\s+(?:en|sous)\s+\d+\s*(?:minutes?|heures?|h)\b/i,
  /\b(?:openai|chatgpt|intelligence artificielle|base de donn[eé]es|r[eé]f[eé]rence\s+ev-)\b/i,
];

export function openAIOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? (item as Record<string, unknown>).content as Array<
        Record<string, unknown>
      >
      : [];
    for (const part of content) {
      if (
        (part.type === "output_text" || part.type === "text") &&
        typeof part.text === "string"
      ) return part.text;
    }
  }
  return "";
}

export function parseAIAnswer(raw: string): AIAnswer | null {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (!ALLOWED_INTENTS.has(value.intent as AIAnswer["intent"])) return null;
    if (typeof value.answer !== "string") return null;
    const answer = value.answer.replace(/\s+/g, " ").trim();
    if (answer.length < 3 || answer.length > 500) return null;
    if (typeof value.needs_human !== "boolean") return null;
    if (
      value.suggested_question !== null &&
      typeof value.suggested_question !== "string"
    ) return null;
    if (value.safety !== null && typeof value.safety !== "string") return null;
    const suggestedQuestion = typeof value.suggested_question === "string"
      ? value.suggested_question.replace(/\s+/g, " ").trim()
      : null;
    const safety = typeof value.safety === "string"
      ? value.safety.replace(/\s+/g, " ").trim()
      : null;
    if ((suggestedQuestion?.length || 0) > 180 || (safety?.length || 0) > 240) {
      return null;
    }
    if (
      FORBIDDEN_CLAIMS.some((pattern) =>
        pattern.test(`${safety || ""} ${answer}`)
      )
    ) return null;

    return {
      intent: value.intent as AIAnswer["intent"],
      answer,
      needs_human: value.needs_human,
      suggested_question: suggestedQuestion || null,
      safety: safety || null,
    };
  } catch {
    return null;
  }
}

export function estimateGPT5MiniCost(
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number,
) {
  return estimateAIResponseCost(
    "gpt-5-mini",
    inputTokens,
    cachedInputTokens,
    outputTokens,
  );
}

type TokenPrices = {
  input: number;
  cachedInput: number;
  output: number;
};

const TOKEN_PRICES_PER_MILLION: Array<[RegExp, TokenPrices]> = [
  [/^gpt-5\.6-luna(?:$|-)/, { input: 1, cachedInput: 0.1, output: 6 }],
  [/^gpt-5-nano(?:$|-)/, { input: 0.05, cachedInput: 0.005, output: 0.4 }],
  [/^gpt-4o-mini(?:$|-)/, { input: 0.15, cachedInput: 0.075, output: 0.6 }],
  [/^gpt-5-mini(?:$|-)/, { input: 0.25, cachedInput: 0.025, output: 2 }],
];

export function estimateAIResponseCost(
  model: string,
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number,
) {
  const input = Math.max(0, Number(inputTokens) || 0);
  const cached = Math.min(input, Math.max(0, Number(cachedInputTokens) || 0));
  const output = Math.max(0, Number(outputTokens) || 0);
  const prices = TOKEN_PRICES_PER_MILLION.find(([pattern]) =>
    pattern.test(model)
  )?.[1] ?? TOKEN_PRICES_PER_MILLION.at(-1)![1];
  return (input - cached) * prices.input / 1_000_000 +
    cached * prices.cachedInput / 1_000_000 +
    output * prices.output / 1_000_000;
}
