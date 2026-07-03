"use client";

import { HTMLAttributes } from "react";
import { motion } from "framer-motion";

export function Card({
  className = "",
  children,
  hoverable = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`rounded-lg border border-kraft-tan bg-warm-white shadow-sm ${
        hoverable ? "hover:shadow-md" : ""
      } ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.div>
  );
}
