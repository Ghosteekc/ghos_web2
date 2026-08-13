import { isValidElement, type ReactNode } from "react";
import { cn } from "@/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  /** Back / primary chrome control (leading when aria-label contains «Назад»). */
  action?: ReactNode;
  /** Optional right-side control (e.g. «Новый») alongside a leading back button. */
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
};

function nodeName(node: unknown): string {
  if (typeof node !== "function" && typeof node !== "object") return "";
  const t = node as { displayName?: string; name?: string };
  return t.displayName || t.name || "";
}

/** Back control sits on the left; other actions stay on the right. */
function isLeadingAction(action: ReactNode): boolean {
  if (!isValidElement(action)) return false;

  const visit = (node: ReactNode): boolean => {
    if (node == null || typeof node === "boolean") return false;
    if (Array.isArray(node)) return node.some(visit);
    if (!isValidElement(node)) return false;
    const props = node.props as { "aria-label"?: string; children?: ReactNode };
    if (props["aria-label"] && /назад/i.test(props["aria-label"])) return true;
    if (nodeName(node.type).includes("ArrowLeft")) return true;
    return visit(props.children);
  };

  return visit(action);
}

/**
 * Unified page header: title, optional subtitle / action / children.
 * Safe-area and horizontal page padding come from `.app-main`; this component
 * only owns header spacing and alignment (no negative margins).
 */
export function PageHeader({
  title,
  subtitle,
  action,
  trailing,
  children,
  className,
}: PageHeaderProps) {
  const leading = action != null && isLeadingAction(action);
  const actionEl =
    action != null ? <div className="page-header-action">{action}</div> : null;
  const trailingEl =
    trailing != null ? (
      <div className="page-header-action page-header-trailing">{trailing}</div>
    ) : null;

  return (
    <header className={cn("page-header", className)}>
      <div
        className={cn(
          "page-header-bar",
          action != null && (leading ? "page-header-bar--leading" : "page-header-bar--trailing"),
          trailing != null && "page-header-bar--has-trailing",
        )}
      >
        {leading ? actionEl : null}
        <div className="page-header-text">
          <div className="page-header-title-row">
            <h1 className="page-title">{title}</h1>
            {!leading ? actionEl : null}
          </div>
          {subtitle != null && subtitle !== false && subtitle !== "" ? (
            <div className="page-header-subtitle">{subtitle}</div>
          ) : null}
        </div>
        {trailingEl}
      </div>
      {children != null ? <div className="page-header-children">{children}</div> : null}
    </header>
  );
}
