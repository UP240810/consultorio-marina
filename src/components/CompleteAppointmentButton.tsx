"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { useToast } from "@/components/Toast";

export default function CompleteAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}/complete`, { method: "POST" });
    setLoading(false);
    toast("Cita finalizada · encuesta enviada", "success");
    router.refresh();
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      whileTap={{ scale: 0.94 }}
      transition={springSnappy}
      className="text-xs px-2 py-1 rounded-full bg-plum/10 text-plum hover:bg-plum/20 transition-colors"
      title="Marca la cita como completada y envía la encuesta post-sesión"
    >
      {loading ? "…" : "Finalizar y enviar encuesta"}
    </motion.button>
  );
}
