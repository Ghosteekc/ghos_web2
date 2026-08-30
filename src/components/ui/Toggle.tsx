type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Не вызывать haptic при переключении (как в настройках вибрации). */
  noHaptic?: boolean;
  "aria-label"?: string;
};

export function Toggle({ checked, onChange, noHaptic, "aria-label": ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-checked={checked}
      {...(noHaptic ? { "data-no-haptic": true } : {})}
      onClick={() => onChange(!checked)}
      className="toggle-switch shrink-0"
    >
      <span className="toggle-switch-thumb" />
    </button>
  );
}
