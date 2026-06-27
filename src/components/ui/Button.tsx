import { motion } from "framer-motion";
import React from "react";
import { cn } from "@/utils";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}: ButtonProps) {
  const baseStyles = "px-5 py-3 rounded-cr font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-gradient-to-r from-cr-gold to-yellow-500 text-cr-bg shadow-glow hover:shadow-glow-blue",
    secondary: "bg-cr-blue/20 text-cr-blue border border-cr-blue/30 hover:bg-cr-blue/30",
    ghost: "bg-transparent text-cr-muted hover:text-cr-text hover:bg-white/5",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
    </motion.button>
  );
}