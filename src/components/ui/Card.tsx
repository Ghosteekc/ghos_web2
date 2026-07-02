import { motion } from "framer-motion";
import { cn, hapticImpact } from "@/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = "", delay = 0, hover = true, onClick }: CardProps) {
  const handleClick = onClick
    ? () => {
        hapticImpact("light");
        onClick();
      }
    : undefined;

  return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={handleClick}
        className={cn(
          "glass-card p-4 w-full min-w-0 overflow-hidden",
          hover && "hover:shadow-glow",
          onClick && "cursor-pointer",
          className
        )}
      >
      {children}
    </motion.div>
  );
}