import { assert, assertAlmostEquals, assertEquals } from "jsr:@std/assert@1";
import {
  alignAIAnswerWithQuestion,
  estimateAIResponseCost,
  estimateGPT5MiniCost,
  openAIOutputText,
  parseAIAnswer,
} from "./sebastien-ai.ts";

Deno.test("extrait le texte structuré de Responses API", () => {
  assertEquals(
    openAIOutputText({
      output: [{
        content: [{ type: "output_text", text: '{"intent":"repair"}' }],
      }],
    }),
    '{"intent":"repair"}',
  );
});

Deno.test("accepte une réponse courte sans affirmation commerciale", () => {
  assertEquals(
    parseAIAnswer(JSON.stringify({
      intent: "repair",
      answer:
        "Cela peut venir de la batterie ou du logiciel. Quel est le modèle exact ?",
      needs_human: false,
      suggested_question: null,
      safety: null,
    })),
    {
      intent: "repair",
      answer:
        "Cela peut venir de la batterie ou du logiciel. Quel est le modèle exact ?",
      needs_human: false,
      suggested_question: null,
      safety: null,
    },
  );
});

Deno.test("refuse un prix inventé", () => {
  assertEquals(
    parseAIAnswer(JSON.stringify({
      intent: "price",
      answer: "Cette réparation coûte environ 89 €.",
      needs_human: false,
      suggested_question: null,
      safety: null,
    })),
    null,
  );
});

Deno.test("refuse une disponibilité inventée", () => {
  assertEquals(
    parseAIAnswer(JSON.stringify({
      intent: "stock",
      answer: "Ce modèle est disponible en boutique.",
      needs_human: false,
      suggested_question: null,
      safety: null,
    })),
    null,
  );
});

Deno.test("refuse les références techniques visibles", () => {
  assertEquals(
    parseAIAnswer(JSON.stringify({
      intent: "other",
      answer: "Référence EV-ABC : demandez à OpenAI.",
      needs_human: true,
      suggested_question: null,
      safety: null,
    })),
    null,
  );
});

Deno.test("calcule le coût GPT-5 mini avec cache", () => {
  assertEquals(estimateGPT5MiniCost(1000, 500, 200), 0.0005375);
});

Deno.test("calcule le coût selon le modèle configuré", () => {
  assertAlmostEquals(
    estimateAIResponseCost("gpt-5-nano", 1000, 500, 200),
    0.0001075,
  );
  assertAlmostEquals(
    estimateAIResponseCost("gpt-4o-mini-2024-07-18", 1000, 500, 200),
    0.0002325,
  );
  assertAlmostEquals(
    estimateAIResponseCost("gpt-5.6-luna", 1000, 500, 200),
    0.00175,
  );
});

Deno.test("écarte une fausse alerte thermique sans signal dans la question", () => {
  const aligned = alignAIAnswerWithQuestion({
    intent: "repair",
    answer: "Éteignez-le immédiatement car il peut brûler.",
    needs_human: true,
    suggested_question: null,
    safety: "Risque de fumée.",
  }, "Mon Pixel redémarre quand j’ouvre l’appareil photo.");

  assertEquals(aligned.needs_human, false);
  assertEquals(aligned.safety, null);
  assert(aligned.answer.includes("redémarrer"));
});

Deno.test("conserve une vraie alerte thermique", () => {
  const original = {
    intent: "repair" as const,
    answer: "Éteignez-le et ne le rechargez plus.",
    needs_human: true,
    suggested_question: null,
    safety: "Le téléphone chauffe et sent le brûlé.",
  };
  const aligned = alignAIAnswerWithQuestion(
    original,
    "Mon téléphone chauffe et sent le brûlé.",
  );

  assertEquals(aligned, original);
});
