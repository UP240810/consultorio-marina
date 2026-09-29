"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springGentle, springSnappy } from "@/lib/motion";

export default function ConfirmButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleConfirm() {
    setStatus("loading");
    const res = await fetch(`/api/confirm/${token}`, { method: "POST" });
    setStatus(res.ok ? "done" : "error");
  }

  return (
    <AnimatePresence mode="wait">
      {status === "done" ? (
        <motion.p
          key="done"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springGentle}
          className="text-ok font-medium"
        >
          ✓ ¡Listo! Tu cita quedó confirmada.
        </motion.p>
      ) : (
        <motion.div key="idle" exit={{ opacity: 0 }} className="space-y-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={handleConfirm}
            disabled={status === "loading"}
            className="btn-primary w-full"
          >
            {status === "loading" ? "Confirmando…" : "Confirmar mi asistencia"}
          </motion.button>
          {status === "error" && (
            <p className="text-sm text-risk">
              No se pudo confirmar. Intenta de nuevo o llama al consultorio.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
