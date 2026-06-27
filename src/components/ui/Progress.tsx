import { motion } from "framer-motion";
import { cn } from "@/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = "#fbbf24",
  trackColor = "rgba(255,255,255,0.08)",
  label,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-cr-text"
          >
            {label}
          </motion.span>
        )}
        {sublabel && <span className="text-xs text-cr-muted mt-1">{sublabel}</span>}
      </div>
    </div>
  );
}

interface LinearProgressProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function LinearProgress({
  value,
  max = 100,
  color = "#fbbf24",
  className = "",
  showLabel = true,
}: LinearProgressProps) {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-xs text-cr-muted">Winrate</span>
          <span className="text-xs font-semibold text-cr-text">{percent.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 bg-cr-border rounded-full overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full origin-left"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}