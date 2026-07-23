import { useState } from "react";
import { Menu, X } from "lucide-react";

const DISMISS_KEY = "ghosteek-menu-hint-dismissed";

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissHint() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function MenuNavHint({ visible }: { visible: boolean }) {
  const [dismissed, setDismissed] = useState(isDismissed);

  if (!visible || dismissed) return null;

  return (
    <div
      className="menu-nav-hint lg:hidden"
      role="note"
      aria-label="Подсказка о меню навигации"
    >
      <Menu className="w-4 h-4 shrink-0 text-cr-gold" aria-hidden />
      <p className="text-[11px] leading-snug text-cr-text">
        Кнопка меню слева открывает дополнительные разделы: профиль, аналитика, колоды и настройки.
      </p>
      <button
        type="button"
        onClick={() => {
          dismissHint();
          setDismissed(true);
        }}
        className="shrink-0 rounded-md p-1 text-cr-muted"
        aria-label="Скрыть подсказку"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
