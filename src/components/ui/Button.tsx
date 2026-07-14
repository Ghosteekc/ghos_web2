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
  const baseStyles =
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-cr font-medium transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none select-none";
  const variants = {
    primary:
      "bg-gradient-to-r from-cr-gold to-yellow-500 text-cr-bg shadow-glow hover:brightness-105 active:brightness-95",
    secondary:
      "bg-cr-blue/20 text-cr-blue border border-cr-blue/30 hover:bg-cr-blue/30 active:bg-cr-blue/25",
    ghost: "bg-transparent text-cr-muted hover:text-cr-text hover:bg-white/5 active:bg-white/10",
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
    </button>
  );
}