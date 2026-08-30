/** Map any thrown value to a short user-facing message + error code. */

const FRIENDLY_CONNECTION =
  "Нет соединения с ботом, попробуй позже";

const FRIENDLY_PAGE =
  "Не удалось показать страницу. Попробуй ещё раз";

const TECHNICAL_RE =
  /failed to fetch|dynamically imported|loading chunk|chunkloaderror|networkerror|load failed|importing a module|unexpected token|module script|typeerror|referenceerror|syntaxerror|internal error|stack trace|https?:\/\/|\/assets\/|\.js\b|at\s+\S+\s+\(/i;

function looksTechnical(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (TECHNICAL_RE.test(t)) return true;
  // Long English-only blobs are almost never meant for players
  if (t.length > 120 && !/[А-Яа-яЁё]/.test(t)) return true;
  return false;
}

function codeFromMessage(message: string): string | null {
  const m = message.match(/\b(E\d{2,4})\b/i);
  return m ? m[1].toUpperCase() : null;
}

function stripCodeSuffix(message: string): string {
  return message
    .replace(/\n*\s*Код ошибки:\s*E\d{2,4}\s*$/i, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export type UserFacingError = {
  message: string;
  code: string;
};

export function toUserFacingError(
  error: unknown,
  fallbackMessage: string = FRIENDLY_CONNECTION,
): UserFacingError {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const codeRaw = String((error as { code?: unknown }).code ?? "").trim();
    const code = codeRaw || codeFromMessage(String((error as { message?: unknown }).message ?? "")) || "E100";
    const raw = stripCodeSuffix(String((error as { message?: unknown }).message ?? ""));
    if (raw && !looksTechnical(raw)) {
      return { message: raw, code };
    }
    return {
      message: fallbackMessage || FRIENDLY_CONNECTION,
      code,
    };
  }

  if (error instanceof Error) {
    const raw = stripCodeSuffix(error.message || "");
    const name = error.name || "";
    let code = codeFromMessage(raw) || "E200";
    if (/ChunkLoadError/i.test(name) || /dynamically imported|loading chunk/i.test(raw)) {
      code = "E201";
    } else if (/Failed to fetch|NetworkError|Load failed/i.test(raw)) {
      code = "E202";
    }
    if (raw && !looksTechnical(raw)) {
      return { message: raw, code };
    }
    return {
      message: code === "E200" ? FRIENDLY_PAGE : FRIENDLY_CONNECTION,
      code,
    };
  }

  if (typeof error === "string" && error.trim() && !looksTechnical(error)) {
    return {
      message: stripCodeSuffix(error),
      code: codeFromMessage(error) || "E203",
    };
  }

  return { message: fallbackMessage || FRIENDLY_CONNECTION, code: "E100" };
}

export function formatUserFacingError(
  error: unknown,
  fallbackMessage?: string,
): string {
  const { message, code } = toUserFacingError(error, fallbackMessage);
  return `${message}\n\nКод ошибки: ${code}`;
}
