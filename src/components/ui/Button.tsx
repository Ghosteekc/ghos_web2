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
  const variants = {
    primary: "pixel-btn pixel-btn--primary",
    secondary: "pixel-btn pixel-btn--secondary",
    ghost: "pixel-btn pixel-btn--ghost",
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
      className={cn(variants[variant], className)}
    >
      {children}
    </button>
  );
}
