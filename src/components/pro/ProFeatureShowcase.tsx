import { ProBadge } from "./ProLock";
import { PRO_FEATURES } from "./proFeatures";
import type { ProFeature } from "./proFeatures";

const PRIMARY_ID = "ai_coach";
const SECONDARY_FEATURES = PRO_FEATURES.filter((f) => f.id !== PRIMARY_ID);
const PRIMARY = PRO_FEATURES.find((f) => f.id === PRIMARY_ID)!;

function PrimaryFeatureCard({ feature, delay }: { feature: ProFeature; delay: number }) {
  const Icon = feature.icon;
  return (
    <article
      className="pro-feature-primary glass-card ui-enter"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="pro-feature-primary__icon">
          <Icon className="w-5 h-5 text-cr-gold" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-extrabold text-cr-text">{feature.title}</h3>
            <ProBadge />
          </div>
          <p className="text-sm font-semibold text-cr-gold/90 mb-1.5">Персональный AI-тренер</p>
          <p className="text-sm text-cr-muted leading-snug">{feature.description}</p>
        </div>
      </div>
    </article>
  );
}

function CompactFeatureCard({ feature, delay }: { feature: ProFeature; delay: number }) {
  const Icon = feature.icon;
  return (
    <article
      className="pro-feature-compact glass-card ui-enter h-full"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pro-feature-compact__icon">
        <Icon className="w-4 h-4 text-cr-gold" aria-hidden />
      </div>
      <h3 className="text-sm font-bold text-cr-text leading-tight mt-2">{feature.title}</h3>
      <p className="text-xs text-cr-muted leading-snug mt-1">{feature.description}</p>
    </article>
  );
}

export function ProFeatureShowcase() {
  return (
    <section className="space-y-3" aria-labelledby="pro-features-heading">
      <h2 id="pro-features-heading" className="text-base font-semibold text-cr-text">
        Что даёт Pro
      </h2>
      <PrimaryFeatureCard feature={PRIMARY} delay={40} />
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {SECONDARY_FEATURES.map((feature, i) => (
          <CompactFeatureCard key={feature.id} feature={feature} delay={80 + i * 40} />
        ))}
      </div>
    </section>
  );
}
