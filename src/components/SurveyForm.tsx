"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SURVEY_QUESTIONS } from "@/types";
import { stepVariants, springGentle } from "@/lib/motion";

export default function SurveyForm({ token, patientName }: { token: string; patientName: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dischargeReadiness, setDischargeReadiness] = useState<number | null>(null);
  const [riskFactor, setRiskFactor] = useState<boolean | null>(null);
  const [riskDetail, setRiskDetail] = useState("");
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalSteps = SURVEY_QUESTIONS.length + 2; // + escala + riesgo
  const currentQuestion = SURVEY_QUESTIONS[step];
  const variants = stepVariants(1);

  function selectAnswer(questionId: string, option: string) {
    setAnswers((a) => ({ ...a, [questionId]: option }));
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setError(null);
    if (dischargeReadiness === null || riskFactor === null) {
      setError("Faltan preguntas por responder.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/survey/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood_answers: answers,
        discharge_readiness: dischargeReadiness,
        risk_factor: riskFactor,
        risk_factor_detail: riskFactor ? riskDetail : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo enviar la encuesta. Intenta de nuevo.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springGentle}
        className="text-center py-6"
      >
        <p className="text-2xl mb-2">🌿</p>
        <p className="font-medium text-plum">¡Gracias, {patientName.split(" ")[0]}!</p>
        <p className="text-sm text-ink/60 mt-1">Tus respuestas se registraron correctamente.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/50">
        Pregunta {step + 1} de {totalSteps}
      </p>

      <AnimatePresence mode="wait">
        <motion.div key={step} {...variants}>
          {step < SURVEY_QUESTIONS.length && (
            <div className="space-y-3">
              <p className="font-medium">{currentQuestion.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {currentQuestion.options.map((opt) => (
                  <motion.button
                    key={opt}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => selectAnswer(currentQuestion.id, opt)}
                    className="btn-secondary text-sm"
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === SURVEY_QUESTIONS.length && (
            <div className="space-y-3">
              <p className="font-medium">
                En una escala del 1 al 10, ¿qué tan lista/o sientes que estás para concluir tu
                proceso terapéutico próximamente?
              </p>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setDischargeReadiness(n);
                      setStep((s) => s + 1);
                    }}
                    className="btn-secondary text-sm"
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === SURVEY_QUESTIONS.length + 1 && (
            <div className="space-y-3">
              <p className="font-medium">
                ¿Hay algún factor de riesgo que quieras que se informe a tu contacto de emergencia?
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setRiskFactor(false)}
                  className={`btn-secondary text-sm ${riskFactor === false ? "ring-2 ring-lilac" : ""}`}
                >
                  No
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setRiskFactor(true)}
                  className={`btn-secondary text-sm ${riskFactor === true ? "ring-2 ring-lilac" : ""}`}
                >
                  Sí
                </motion.button>
              </div>
              {riskFactor && (
                <motion.textarea
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="input-field"
                  rows={3}
                  placeholder="Cuéntanos brevemente qué está pasando (opcional, tu psicóloga lo revisará)."
                  value={riskDetail}
                  onChange={(e) => setRiskDetail(e.target.value)}
                />
              )}
              {riskFactor !== null && (
                <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">
                  {loading ? "Enviando…" : "Enviar encuesta"}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="text-sm text-risk">{error}</p>}
    </div>
  );
}
