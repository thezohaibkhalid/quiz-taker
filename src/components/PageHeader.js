"use client";

import { motion } from "framer-motion";

export default function PageHeader({ title, subtitle, right }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap items-end justify-between gap-4 mb-8"
    >
      <div>
        <h1 className="font-serif text-3xl text-ink-900 tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-ink-600">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </motion.div>
  );
}
