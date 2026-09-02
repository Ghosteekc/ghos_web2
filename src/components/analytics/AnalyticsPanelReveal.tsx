import type { ReactNode } from "react";
import { Loader } from "@/components/ui";
import { ContentReveal } from "@/motion";

type AnalyticsPanelRevealProps = {
  loading: boolean;
  children?: ReactNode;
};

/**
 * Keeps an Analytics tab mounted while its own data resolves so the loader can
 * hand off to the resulting panel instead of replacing it abruptly.
 */
export function AnalyticsPanelReveal({ loading, children }: AnalyticsPanelRevealProps) {
  return (
    <ContentReveal loading={loading} loader={<Loader variant="section" />}>
      {children}
    </ContentReveal>
  );
}
