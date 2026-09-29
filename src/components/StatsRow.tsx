"use client";

import { motion } from "framer-motion";
import { viewEnter } from "@/lib/motion";

interface StatItem {
  label: string;
  value: string;
  highlight?: "ok" | "risk";
}

export default function StatsRow({ items }: { items: StatItem[] }) {
  return (
    <motion.section
      {...viewEnter}
      className="grid grid-cols-2 md:grid-cols-4 rounded-card border border-lilac/15 bg-white overflow-hidden"
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`p-5 ${i > 0 ? "border-l border-lilac/15" : ""} ${
            item.highlight === "risk" ? "bg-risk/[0.03]" : ""
          }`}
        >
          <p className="text-sm text-ink/50">{item.label}</p>
          <p
            className={`font-display text-2xl mt-1 ${
              item.highlight === "ok"
                ? "text-ok"
                : item.highlight === "risk"
                ? "text-risk"
                : "text-plum"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </motion.section>
  );
}
