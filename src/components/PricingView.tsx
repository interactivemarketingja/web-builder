import React, { useEffect, useState } from 'react';
import { Check, Copy, Layers, Plus, Rocket } from 'lucide-react';
import { PlanTierId, PricingTier } from '../types/builder';

interface PricingViewProps {
  savedProjectsCount: number;
  currentProjectName: string;
  onApplyPricingToCanvas: (tiers: PricingTier[], heading: string, intro: string) => void;
  onOpenDeploy: () => void;
}

type BillingCycle = 'monthly' | 'annual';
type PricingCatalogMode = 'platform' | 'client';

interface StudioPlanDefinition {
  id: PlanTierId;
  name: string;
  audience: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  summary: string;
  siteLimitLabel: string;
  siteLimitNumeric: number | null;
  aiQuotaLabel: string;
  trafficQuotaLabel: string;
  highlights: string[];
  recommended?: boolean;
}

interface ComparisonRow {
  capability: string;
  starter: string;
  pro: string;
  agency: string;
}

const ACTIVE_PLAN_STORAGE_KEY = 'atelier_frame_active_plan_v1';

const PLATFORM_PLANS: StudioPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    audience: 'For solo creators & single launches',
    monthlyPrice: 29,
    annualMonthlyPrice: 23,
    summary: 'Launch one production site with AI generation, live form capture, and built-in analytics.',
    siteLimitLabel: '1 live site',
    siteLimitNumeric: 1,
    aiQuotaLabel: '5 AI builds / mo',
    trafficQuotaLabel: '5,000 visits / mo',
    highlights: [
      '1 live deployed site (/sites/slug)',
      '5 AI website generations per month',
      '5,000 tracked monthly page views',
      'Live contact form & lead inbox',
      'Responsive desktop, tablet & mobile preview',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Studio',
    audience: 'For freelancers & growing businesses',
    monthlyPrice: 69,
    annualMonthlyPrice: 55,
    summary: 'Unlock clean HTML5/CSS3 developer handoff, unlimited AI section rewrites, and 10 live sites.',
    siteLimitLabel: '10 live sites',
    siteLimitNumeric: 10,
    aiQuotaLabel: 'Unlimited AI builds',
    trafficQuotaLabel: '50,000 visits / mo',
    recommended: true,
    highlights: [
      '10 live deployed client or brand sites',
      'Unlimited AI template builds & block rewrites',
      'Clean HTML5 & CSS3 Code Handoff export',
      '50,000 tracked monthly page views',
      'Custom domain canonical & SEO meta controls',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    audience: 'For web studios & client retainers',
    monthlyPrice: 149,
    annualMonthlyPrice: 119,
    summary: 'Unlimited client workspaces, white-label exports, and portfolio-wide conversion analytics.',
    siteLimitLabel: 'Unlimited sites',
    siteLimitNumeric: null,
    aiQuotaLabel: 'Unlimited + multi-client',
    trafficQuotaLabel: '250,000 visits / mo',
    highlights: [
      'Unlimited live deployed sites & project snapshots',
      'Client-grouped analytics & CSV lead exports',
      'White-label HTML/CSS ZIP developer handoff',
      '250,000 tracked monthly page views',
      'Dedicated client duplication & retainer presets',
    ],
  },
];

const PLATFORM_MATRIX: ComparisonRow[] = [
  { capability: 'Live Deployed Sites', starter: '1 site', pro: '10 sites', agency: 'Unlimited' },
  { capability: 'Saved Project Snapshots', starter: '3 projects', pro: '25 projects', agency: 'Unlimited' },
  { capability: 'AI Website Generations', starter: '5 / month', pro: 'Unlimited', agency: 'Unlimited' },
  { capability: 'Single-Section AI Rewrites', starter: '20 / month', pro: 'Unlimited', agency: 'Unlimited' },
  { capability: 'HTML5 & CSS3 Code Handoff', starter: 'Preview only', pro: 'Full copy & download', agency: 'White-label + custom prefix' },
  { capability: 'Tracked Analytics Volume', starter: '5,000 views / mo', pro: '50,000 views / mo', agency: '250,000 views / mo' },
  { capability: 'Lead Capture & CSV Export', starter: 'Inbox only', pro: 'Inbox + CSV export', agency: 'Multi-client CRM + CSV' },
  { capability: 'Supabase Persistence', starter: 'Included', pro: 'Included', agency: 'Dedicated schema ready' },
];

const CLIENT_RETAINER_PLANS: StudioPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Managed Hosting',
    audience: 'For static launches & local businesses',
    monthlyPrice: 49,
    annualMonthlyPrice: 39,
    summary: 'Reliable SSL hosting, custom domain routing, and automated contact form lead delivery.',
    siteLimitLabel: '1 custom domain',
    siteLimitNumeric: 1,
    aiQuotaLabel: 'Quarterly text refresh',
    trafficQuotaLabel: '15,000 visits / mo',
    highlights: [
      'Custom domain + automatic HTTPS SSL',
      'Global edge hosting & uptime monitoring',
      'Live contact form lead capture',
      'Up to 15,000 monthly visitor views',
    ],
  },
  {
    id: 'pro',
    name: 'Growth & Analytics',
    audience: 'For lead-driven companies',
    monthlyPrice: 99,
    annualMonthlyPrice: 79,
    summary: 'Everything in Managed Hosting plus conversion analytics, CTA tracking, and monthly updates.',
    siteLimitLabel: '1 primary + staging',
    siteLimitNumeric: 2,
    aiQuotaLabel: '2 content updates / mo',
    trafficQuotaLabel: '75,000 visits / mo',
    recommended: true,
    highlights: [
      'Everything in Managed Hosting',
      'Monthly traffic, CTA & conversion report',
      '2 copy or section updates per month',
      'Lead inbox export & priority turnaround',
    ],
  },
  {
    id: 'agency',
    name: 'Care + Code Ownership',
    audience: 'For scaling teams & internal devs',
    monthlyPrice: 199,
    annualMonthlyPrice: 159,
    summary: 'Full source handoff package alongside managed staging, unlimited edits, and priority support.',
    siteLimitLabel: 'Multi-page + staging',
    siteLimitNumeric: null,
    aiQuotaLabel: 'Unlimited updates',
    trafficQuotaLabel: '250,000 visits / mo',
    highlights: [
      'Clean HTML5 & CSS3 source code delivery',
      'Unlimited section & campaign refreshes',
      'Staging preview before live publishing',
      'Dedicated analytics & lead reporting',
    ],
  },
];

const CLIENT_MATRIX: ComparisonRow[] = [
  { capability: 'Custom Domain & SSL', starter: 'Included', pro: 'Included', agency: 'Included + staging URL' },
  { capability: 'Content & Section Updates', starter: 'Pay per request', pro: '2 updates / month', agency: 'Unlimited updates' },
  { capability: 'Visitor & CTA Analytics', starter: 'Basic view count', pro: 'Full funnel + CSV report', agency: 'Executive dashboard access' },
  { capability: 'Contact Lead Capture', starter: 'Email + inbox', pro: 'Inbox + monthly export', agency: 'Custom webhook / API' },
  { capability: 'Traffic Allowance', starter: '15,000 views / mo', pro: '75,000 views / mo', agency: '250,000 views / mo' },
  { capability: 'Source Code Ownership', starter: 'Managed only', pro: 'Optional buyout', agency: 'Full HTML/CSS handoff included' },
];

function loadStoredPlan(): PlanTierId {
  try {
    const saved = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
    if (saved === 'starter' || saved === 'pro' || saved === 'agency') {
      return saved;
    }
  } catch {
    // Ignore storage read error
  }
  return 'pro';
}

export const PricingView: React.FC<PricingViewProps> = ({
  savedProjectsCount,
  currentProjectName,
  onApplyPricingToCanvas,
  onOpenDeploy,
}) => {
  const [catalogMode, setCatalogMode] = useState<PricingCatalogMode>('platform');
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [activePlan, setActivePlan] = useState<PlanTierId>(loadStoredPlan);
  const [liveSitesCount, setLiveSitesCount] = useState<number>(0);
  const [monthlyViewsCount, setMonthlyViewsCount] = useState<number>(0);
  const [copiedProposal, setCopiedProposal] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/analytics?days=30')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!mounted || !json?.summary) return;
        setLiveSitesCount(Number(json.summary.publishedSitesCount || 0));
        setMonthlyViewsCount(Number(json.summary.totalViews || 0));
      })
      .catch(() => {
        // Silent fallback if backend unavailable
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectPlan = (planId: PlanTierId) => {
    setActivePlan(planId);
    try {
      localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, planId);
    } catch {
      // Ignore quota errors
    }
  };

  const plans = catalogMode === 'platform' ? PLATFORM_PLANS : CLIENT_RETAINER_PLANS;
  const matrix = catalogMode === 'platform' ? PLATFORM_MATRIX : CLIENT_MATRIX;
  const currentWorkspacePlan =
    PLATFORM_PLANS.find((p) => p.id === activePlan) || PLATFORM_PLANS[1];

  const handleInsertToCanvas = () => {
    const tiers: PricingTier[] = plans.map((plan) => {
      const priceValue = billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice;
      return {
        name: plan.name,
        audience: plan.audience,
        price: `$${priceValue}`,
        cadence: billing === 'annual' ? '/ month (billed annually)' : '/ month',
        description: plan.summary,
        features: plan.highlights,
        ctaLabel: catalogMode === 'client' ? `Choose ${plan.name}` : `Start ${plan.name}`,
        highlighted: Boolean(plan.recommended),
      };
    });

    const heading =
      catalogMode === 'client'
        ? 'Hosting & Ongoing Care Plans'
        : 'Transparent Plans for Every Stage';
    const intro =
      catalogMode === 'client'
        ? 'Select a managed hosting and support tier tailored to your launch velocity and reporting needs.'
        : 'Start with a single site or scale across unlimited client deployments with clean HTML/CSS handoff.';

    onApplyPricingToCanvas(tiers, heading, intro);
  };

  const handleCopyProposal = async () => {
    const lines = [
      `${catalogMode === 'client' ? 'Client Hosting & Care Packages' : 'Atelier Frame Platform Plans'} (${billing === 'annual' ? 'Annual Billing - 20% Off' : 'Monthly Billing'})`,
      '',
      ...plans.map((p) => {
        const price = billing === 'annual' ? p.annualMonthlyPrice : p.monthlyPrice;
        return `- ${p.name} ($${price}/mo): ${p.summary}\n  Includes: ${p.highlights.join(' · ')}`;
      }),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedProposal(true);
      setTimeout(() => setCopiedProposal(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <main className="flex-1 overflow-y-auto studio-scroll bg-[#F4F2EC] p-6 lg:p-8 text-black">
      <div className="max-w-[1220px] mx-auto space-y-6">
        {/* Header & Mode Controls */}
        <div className="bg-white border border-[#DAD4C6] rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-black font-display tracking-tight">
              Pricing &amp; Commercial Tiers
            </h1>
            <p className="text-sm text-black mt-1.5 leading-relaxed">
              Manage your active workspace tier or switch to Client Retainer mode to insert ready-to-sell hosting packages directly onto{' '}
              <span className="font-semibold">{currentProjectName}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Catalog Audience Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]">
              <button
                type="button"
                onClick={() => setCatalogMode('platform')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  catalogMode === 'platform'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                Platform Plans
              </button>
              <button
                type="button"
                onClick={() => setCatalogMode('client')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  catalogMode === 'client'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                Client Retainers
              </button>
            </div>

            {/* Billing Cadence Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]">
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  billing === 'monthly'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling('annual')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  billing === 'annual'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Usage & Quick Actions Strip */}
        <div className="bg-white border border-[#DAD4C6] rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs font-semibold text-black">Active Workspace Tier</div>
              <div className="text-base font-bold text-black mt-0.5">
                {currentWorkspacePlan.name} ·{' '}
                <span className="font-mono tabular-nums">
                  ${billing === 'annual' ? currentWorkspacePlan.annualMonthlyPrice : currentWorkspacePlan.monthlyPrice}/mo
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <div className="text-xs font-semibold text-black">Live Deployed Sites</div>
              <div className="text-base font-bold text-black mt-0.5 font-mono tabular-nums">
                {liveSitesCount} / {currentWorkspacePlan.siteLimitNumeric ?? 'Unlimited'}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <div className="text-xs font-semibold text-black">Saved Projects</div>
              <div className="text-base font-bold text-black mt-0.5 font-mono tabular-nums">
                {savedProjectsCount}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <div className="text-xs font-semibold text-black">30-Day Views</div>
              <div className="text-base font-bold text-black mt-0.5 font-mono tabular-nums">
                {monthlyViewsCount.toLocaleString()} / {currentWorkspacePlan.trafficQuotaLabel.replace(' visits / mo', '')}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyProposal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-black whitespace-nowrap cursor-pointer"
            >
              {copiedProposal ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedProposal ? 'Copied Summary' : 'Copy Tier Summary'}</span>
            </button>
            <button
              type="button"
              onClick={handleInsertToCanvas}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Insert Tiers Into Website</span>
            </button>
          </div>
        </div>

        {/* 3 Tier Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan) => {
            const displayPrice =
              billing === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice;
            const annualTotal = displayPrice * 12;
            const isSelectedPlatform = catalogMode === 'platform' && activePlan === plan.id;
            const isHighlighted = Boolean(plan.recommended);

            return (
              <section
                key={`${catalogMode}-${plan.id}`}
                className={`bg-white rounded-xl p-6 flex flex-col justify-between transition-colors ${
                  isHighlighted
                    ? 'border-2 border-blue-600 shadow-sm'
                    : 'border border-[#DAD4C6]'
                }`}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-xl font-bold text-black font-display">
                      {plan.name}
                    </h2>
                    {plan.recommended && (
                      <span className="text-xs font-bold text-blue-700 whitespace-nowrap">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-black mt-1">{plan.audience}</p>

                  <div className="mt-5 pb-5 border-b border-[#DAD4C6]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-black font-display tabular-nums">
                        ${displayPrice}
                      </span>
                      <span className="text-sm font-medium text-black">/ month</span>
                    </div>
                    <p className="text-xs text-black mt-1.5 font-mono tabular-nums">
                      {billing === 'annual'
                        ? `$${annualTotal.toLocaleString()} billed annually (20% off)`
                        : `or $${plan.annualMonthlyPrice}/mo billed annually`}
                    </p>
                  </div>

                  <p className="text-sm text-black mt-4 leading-relaxed">
                    {plan.summary}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-4 py-3 border-y border-[#DAD4C6] text-xs text-black">
                    <div>
                      <div className="font-semibold">Sites</div>
                      <div className="mt-0.5 tabular-nums">{plan.siteLimitLabel}</div>
                    </div>
                    <div>
                      <div className="font-semibold">AI Quota</div>
                      <div className="mt-0.5 tabular-nums">{plan.aiQuotaLabel}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Traffic</div>
                      <div className="mt-0.5 tabular-nums">{plan.trafficQuotaLabel}</div>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-sm text-black">
                    {plan.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4">
                  {catalogMode === 'platform' ? (
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        isSelectedPlatform
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : isHighlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-slate-300 bg-white text-black hover:bg-slate-50'
                      }`}
                    >
                      {isSelectedPlatform ? 'Current Active Plan' : `Select ${plan.name}`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onOpenDeploy}
                      className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                        isHighlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'border border-slate-300 bg-white text-black hover:bg-slate-50'
                      }`}
                    >
                      <Rocket className="w-4 h-4" />
                      <span>Publish Client Site</span>
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Comparison Matrix Table */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-black" />
              <h2 className="text-base font-bold text-black">
                {catalogMode === 'platform'
                  ? 'Platform Tier Limits & Capabilities'
                  : 'Client Retainer Deliverables Matrix'}
              </h2>
            </div>
            <span className="text-sm font-medium text-black">
              {billing === 'annual' ? 'Annual Rates Shown' : 'Monthly Rates Shown'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-black">
              <thead>
                <tr className="border-b border-[#DAD4C6] bg-[#FAF9F5]">
                  <th className="py-3.5 px-6 font-bold text-black">Capability</th>
                  <th className="py-3.5 px-6 font-bold text-black">{plans[0].name}</th>
                  <th className="py-3.5 px-6 font-bold text-[#1D4ED8]">{plans[1].name}</th>
                  <th className="py-3.5 px-6 font-bold text-black">{plans[2].name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DAD4C6]">
                {matrix.map((row) => (
                  <tr key={row.capability} className="hover:bg-[#FAF9F5]">
                    <td className="py-3.5 px-6 font-semibold text-black">{row.capability}</td>
                    <td className="py-3.5 px-6 text-black tabular-nums">{row.starter}</td>
                    <td className="py-3.5 px-6 font-medium text-black tabular-nums">{row.pro}</td>
                    <td className="py-3.5 px-6 text-black tabular-nums">{row.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};
