import { useCallback, useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/utils";

interface ScrollToTopButtonProps {
  threshold?: number;
  className?: string;
}

export function ScrollToTopButton({ threshold = 320, className }: ScrollToTopButtonProps) {
  const [pastThreshold, setPastThreshold] = useState(false);
  const [hidingAfterClick, setHidingAfterClick] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setPastThreshold(y > threshold);
      if (y <= threshold) {
        setHidingAfterClick(false);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const visible = pastThreshold && !hidingAfterClick;

  const scrollToTop = useCallback(() => {
    setHidingAfterClick(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
      type="button"
      aria-label="Наверх"
      aria-hidden={!visible}
      onClick={scrollToTop}
      className={cn(
        "scroll-to-top-btn",
        visible ? "scroll-to-top-btn--visible" : "scroll-to-top-btn--hidden",
        className,
      )}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
