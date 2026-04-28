/**
 * StatsInsights — auto-generated insight cards from real data.
 * No AI, no backend — pure derivation from the stats response.
 */
import { useTranslation } from 'react-i18next';
import { TrendingUp, AlertTriangle, CheckCircle2, Zap, Target } from 'lucide-react';
import type { StatsResponse } from '../types';

interface Insight {
  icon: React.ReactNode;
  title: string;
  body: string;
  variant: 'positive' | 'warning' | 'neutral';
}

function formatCost(v: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}
function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const VARIANT_STYLES: Record<Insight['variant'], { card: string; icon: string }> = {
  positive: {
    card: 'border-emerald-500/25 bg-emerald-500/5',
    icon: 'text-emerald-500',
  },
  warning: {
    card: 'border-amber-400/30 bg-amber-400/5',
    icon: 'text-amber-400',
  },
  neutral: {
    card: 'border-blue-500/20 bg-blue-500/5',
    icon: 'text-blue-500',
  },
};

function InsightCard({ icon, title, body, variant }: Insight) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div className={`rounded-[16px] border p-4 ${styles.card}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${styles.icon}`}>{icon}</div>
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

interface StatsInsightsProps {
  data: StatsResponse;
  periodDays: number;
}

export function StatsInsights({ data, periodDays }: StatsInsightsProps) {
  const { t } = useTranslation();
  const { summary, timeSeries, byProject } = data;
  const byStatus = summary.byStatus ?? { pending: 0, printed: 0, postProcessed: 0, delivered: 0, failed: 0 };

  const insights: Insight[] = [];

  // ── 1. Productividad ────────────────────────────────────────────────────────
  if (summary.totalPieces > 0 && periodDays > 0) {
    const perDay = summary.totalPieces / periodDays;
    if (perDay >= 1) {
      insights.push({
        icon: <TrendingUp className="h-4 w-4" />,
        title: t('insight_productive_title'),
        body: t('insight_productive_body', {
          count: perDay.toFixed(1),
          days: periodDays,
        }),
        variant: 'positive',
      });
    }
  }

  // ── 2. Ratio de éxito ───────────────────────────────────────────────────────
  const successCount = byStatus.printed + byStatus.postProcessed + byStatus.delivered;
  const successRate  = summary.totalPieces > 0 ? (successCount / summary.totalPieces) * 100 : 0;

  if (summary.totalPieces >= 5) {
    if (successRate >= 90) {
      insights.push({
        icon: <CheckCircle2 className="h-4 w-4" />,
        title: t('insight_success_high_title'),
        body: t('insight_success_high_body', { rate: successRate.toFixed(1) }),
        variant: 'positive',
      });
    } else if (byStatus.failed > 0) {
      const failRate = (byStatus.failed / summary.totalPieces) * 100;
      insights.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        title: t('insight_failures_title'),
        body: t('insight_failures_body', { count: byStatus.failed, rate: failRate.toFixed(1) }),
        variant: 'warning',
      });
    }
  }

  // ── 3. Coste medio ──────────────────────────────────────────────────────────
  if (summary.avgCostPerPiece > 0) {
    const isExpensive = summary.avgCostPerPiece > 10;
    insights.push({
      icon: <Target className="h-4 w-4" />,
      title: t('insight_avg_cost_title'),
      body: t('insight_avg_cost_body', {
        avg: formatCost(summary.avgCostPerPiece),
        total: formatCost(summary.totalCost),
      }),
      variant: isExpensive ? 'warning' : 'neutral',
    });
  }

  // ── 4. Tendencia (últimos vs primeros períodos) ─────────────────────────────
  if (timeSeries.length >= 4) {
    const half   = Math.floor(timeSeries.length / 2);
    const first  = timeSeries.slice(0, half).reduce((s, p) => s + p.pieces, 0);
    const second = timeSeries.slice(half).reduce((s, p) => s + p.pieces, 0);
    if (first > 0) {
      const change = ((second - first) / first) * 100;
      if (Math.abs(change) >= 10) {
        insights.push({
          icon: <TrendingUp className={`h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />,
          title: change > 0 ? t('insight_trend_up_title') : t('insight_trend_down_title'),
          body: t('insight_trend_body', { change: Math.abs(change).toFixed(0) }),
          variant: change > 0 ? 'positive' : 'warning',
        });
      }
    }
  }

  // ── 5. Proyecto estrella ────────────────────────────────────────────────────
  if (byProject.length > 0) {
    const top = byProject[0];
    insights.push({
      icon: <Zap className="h-4 w-4" />,
      title: t('insight_top_project_title'),
      body: t('insight_top_project_body', {
        name:   top.title,
        pieces: top.pieces,
        cost:   formatCost(top.cost),
        time:   formatTime(top.secs),
      }),
      variant: 'neutral',
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {t('stats_insights_title')}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {insights.map((ins, i) => (
          <InsightCard key={i} {...ins} />
        ))}
      </div>
    </div>
  );
}
