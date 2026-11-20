import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Link2,
  Megaphone,
  Pause,
  Play,
  Rocket,
  Sparkles,
  Tag,
  Target,
} from 'lucide-react';
import { slugify } from '../data/presets';
import {
  DeployedSiteRecord,
  MarketingAdKit,
  MarketingOrderRecord,
  MarketingOrderStatus,
  MarketingPackageId,
  SiteMarketingConfig,
  SiteProject,
} from '../types/builder';

interface MarketingViewProps {
  project: SiteProject;
  onUpdateMarketing: (patch: Partial<SiteMarketingConfig>) => void;
  onOpenDeploy: () => void;
  initialSessionId?: string | null;
  onClearSessionParam?: () => void;
}

type MarketingSubTab = 'launch' | 'kit' | 'tracking' | 'orders';

interface MarketingPackageDef {
  id: MarketingPackageId;
  name: string;
  tagline: string;
  priceUsd: number;
  billingType: 'one_time' | 'monthly';
  defaultBudgetUsd: number;
  deliverables: string[];
  recommended?: boolean;
}

const MARKETING_PACKAGES: MarketingPackageDef[] = [
  {
    id: 'seo_boost',
    name: 'Search & Local SEO Boost',
    tagline: 'Technical SEO setup, Schema.org markup & Google Search ad pack',
    priceUsd: 149,
    billingType: 'one_time',
    defaultBudgetUsd: 100,
    deliverables: [
      'Google Search Console & sitemap submission checklist',
      'Schema.org JSON-LD + OpenGraph meta optimization',
      '15 high-intent target keywords & responsive search ads',
      'UTM attribution link kit for organic & local directories',
    ],
  },
  {
    id: 'social_launch',
    name: 'Paid Social Launch',
    tagline: 'Instagram, Facebook & LinkedIn creative setup + pixel tracking',
    priceUsd: 299,
    billingType: 'monthly',
    defaultBudgetUsd: 300,
    recommended: true,
    deliverables: [
      'Meta Pixel & LinkedIn Insight tag embedded in site',
      'Multi-variant Instagram, Facebook & LinkedIn ad copy',
      'Audience segmentation & conversion goal setup',
      'Live UTM funnel tracking in Analytics dashboard',
    ],
  },
  {
    id: 'full_funnel',
    name: 'Full-Funnel Growth Retainer',
    tagline: 'Search + Paid Social + Email outreach & conversion optimization',
    priceUsd: 599,
    billingType: 'monthly',
    defaultBudgetUsd: 750,
    deliverables: [
      'Cross-channel Google Search, Meta & LinkedIn campaigns',
      'Promo announcement bar + high-converting email broadcast',
      'GA4 + Google Ads + Meta retargeting pixel instrumentation',
      'Dedicated monthly attribution & lead conversion reporting',
    ],
  },
  {
    id: 'ad_booster',
    name: 'Custom Ad Spend Booster',
    tagline: 'Allocate any custom ad budget ($50+) with $49 setup fee',
    priceUsd: 49,
    billingType: 'one_time',
    defaultBudgetUsd: 200,
    deliverables: [
      'Flexible ad spend pass-through starting at $50',
      'Custom UTM campaign URL for instant traffic tracking',
      'AI-generated ad headlines & primary copy kit',
      'Real-time visitor & lead attribution tracking',
    ],
  },
];

const CHANNEL_OPTIONS = [
  'Google Search',
  'Meta (Instagram & Facebook)',
  'LinkedIn Sponsored',
  'Email Launch Blast',
];

const GOAL_OPTIONS = [
  'Leads & Inquiries',
  'Book Discovery Calls',
  'Product Launch & Sales',
  'Local Traffic & Footfall',
];

function formatStatusLabel(status: MarketingOrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'Pending Payment';
    case 'paid':
      return 'Paid · Ready';
    case 'active':
      return 'Live Campaign';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
  }
}

export const MarketingView: React.FC<MarketingViewProps> = ({
  project,
  onUpdateMarketing,
  onOpenDeploy,
  initialSessionId,
  onClearSessionParam,
}) => {
  const [subTab, setSubTab] = useState<MarketingSubTab>('launch');
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [deployments, setDeployments] = useState<DeployedSiteRecord[]>([]);
  const [orders, setOrders] = useState<MarketingOrderRecord[]>([]);

  // Launch & Checkout Form
  const [targetSlug, setTargetSlug] = useState(() =>
    slugify(project.lastDeployedSlug || project.slug || project.name)
  );
  const [selectedPackageId, setSelectedPackageId] =
    useState<MarketingPackageId>('social_launch');
  const [adBudgetUsd, setAdBudgetUsd] = useState<number>(300);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'Google Search',
    'Meta (Instagram & Facebook)',
  ]);
  const [campaignGoal, setCampaignGoal] = useState(GOAL_OPTIONS[0]);
  const [targetAudience, setTargetAudience] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);

  // AI Ad Kit state
  const [adKit, setAdKit] = useState<MarketingAdKit | null>(null);
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  const [kitError, setKitError] = useState<string | null>(null);

  // UTM Builder state
  const [utmSource, setUtmSource] = useState('google');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState(() =>
    slugify(`${project.slug || project.name}-launch`)
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedPkg =
    MARKETING_PACKAGES.find((p) => p.id === selectedPackageId) ||
    MARKETING_PACKAGES[1];

  const loadMarketingState = async () => {
    try {
      const [cfgRes, depRes, ordRes] = await Promise.all([
        fetch('/api/marketing/config'),
        fetch('/api/deployments'),
        fetch('/api/marketing/orders'),
      ]);
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setStripeConfigured(Boolean(cfg.stripeConfigured));
      }
      if (depRes.ok) {
        const depData = await depRes.json();
        const list: DeployedSiteRecord[] = Array.isArray(depData.deployments)
          ? depData.deployments
          : [];
        setDeployments(list);
      }
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(Array.isArray(ordData.orders) ? ordData.orders : []);
      }
    } catch {
      // Silent fallback on transient fetch failure
    }
  };

  useEffect(() => {
    void loadMarketingState();
  }, []);

  // Verify Stripe Checkout return session if present
  useEffect(() => {
    if (!initialSessionId) return;
    let active = true;
    fetch('/api/marketing/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: initialSessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.paid) {
          setOrderNotice(
            `Payment confirmed for "${data.order?.packageName}". Your campaign is ready to launch.`
          );
          setSubTab('orders');
          void loadMarketingState();
        } else if (data.error) {
          setOrderError(data.error);
        }
        onClearSessionParam?.();
      })
      .catch(() => {
        if (active) onClearSessionParam?.();
      });

    return () => {
      active = false;
    };
  }, [initialSessionId, onClearSessionParam]);

  const selectedSiteInfo = useMemo(() => {
    const dep = deployments.find((d) => d.slug === targetSlug);
    if (dep) {
      return {
        slug: dep.slug,
        name: dep.name,
        clientName: dep.clientName || project.clientName || 'Internal Studio',
        customDomain: dep.customDomain || null,
        isPublished: true,
      };
    }
    return {
      slug: slugify(project.lastDeployedSlug || project.slug || project.name),
      name: project.name,
      clientName: project.clientName || 'Internal Studio',
      customDomain: project.seo?.customDomain || null,
      isPublished: Boolean(project.lastDeployedSlug),
    };
  }, [deployments, targetSlug, project]);

  const copyText = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.length > 1
          ? prev.filter((c) => c !== channel)
          : prev
        : [...prev, channel]
    );
  };

  const handlePackageSelect = (pkg: MarketingPackageDef) => {
    setSelectedPackageId(pkg.id);
    setAdBudgetUsd(pkg.defaultBudgetUsd);
  };

  const totalDueUsd = selectedPkg.priceUsd + Math.max(0, adBudgetUsd);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    setOrderNotice(null);
    setPendingCheckoutUrl(null);
    setIsSubmittingOrder(true);

    try {
      const res = await fetch('/api/marketing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackageId,
          siteSlug: selectedSiteInfo.slug,
          siteName: selectedSiteInfo.name,
          clientName: selectedSiteInfo.clientName,
          customerEmail: customerEmail.trim(),
          adBudgetUsd,
          channels: selectedChannels,
          targetAudience: targetAudience.trim(),
          campaignGoal,
          utmCampaign,
          generatedKit: adKit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit marketing campaign order.');
      }

      if (data.order) {
        setOrders((prev) => [data.order, ...prev.filter((o) => o.id !== data.order.id)]);
      }

      if (data.checkoutUrl) {
        setPendingCheckoutUrl(data.checkoutUrl);
        setOrderNotice(
          'Stripe Checkout session created. Click "Complete Card Payment" below to pay securely.'
        );
      } else {
        setOrderNotice(
          `Campaign order ${data.order?.id} saved for ${selectedSiteInfo.name} ($${totalDueUsd}). Review it under Campaign Orders.`
        );
      }
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'Unable to create campaign order.'
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleGenerateAdKit = async () => {
    setIsGeneratingKit(true);
    setKitError(null);
    try {
      const highlights = project.blocks
        .slice(0, 5)
        .map((b) => {
          if (b.type === 'hero') return b.props.headline;
          if (b.type === 'features') return b.props.heading;
          if (b.type === 'showcase') return b.props.heading;
          if (b.type === 'cta') return b.props.headline;
          return b.label;
        })
        .filter(Boolean)
        .join(' | ');

      const res = await fetch('/api/marketing/generate-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: selectedSiteInfo.name,
          siteDescription: project.description,
          targetAudience,
          campaignGoal,
          channels: selectedChannels,
          highlights,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate ad kit.');
      }
      setAdKit(data.kit);
    } catch (err) {
      setKitError(
        err instanceof Error ? err.message : 'Unable to generate ad kit.'
      );
    } finally {
      setIsGeneratingKit(false);
    }
  };

  const handleOrderStatusChange = async (
    orderId: string,
    status: MarketingOrderStatus
  ) => {
    try {
      const res = await fetch(`/api/marketing/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      }
    } catch {
      // Ignore network failure
    }
  };

  const baseSiteUrl = useMemo(() => {
    if (selectedSiteInfo.customDomain) {
      const dom = selectedSiteInfo.customDomain.replace(/^https?:\/\//i, '');
      return `https://${dom}`;
    }
    return `${window.location.origin}/sites/${selectedSiteInfo.slug}`;
  }, [selectedSiteInfo]);

  const trackedCampaignUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (utmSource.trim()) params.set('utm_source', utmSource.trim());
    if (utmMedium.trim()) params.set('utm_medium', utmMedium.trim());
    if (utmCampaign.trim()) params.set('utm_campaign', utmCampaign.trim());
    const qs = params.toString();
    return qs ? `${baseSiteUrl}?${qs}` : baseSiteUrl;
  }, [baseSiteUrl, utmSource, utmMedium, utmCampaign]);

  const mkt = project.marketing || {};
  const totalRevenueUsd = orders
    .filter((o) => o.status === 'paid' || o.status === 'active' || o.status === 'completed')
    .reduce((acc, o) => acc + o.totalUsd, 0);
  const activeCampaignsCount = orders.filter((o) => o.status === 'active').length;

  return (
    <div className="flex-1 overflow-y-auto studio-scroll bg-[#F4F2EC]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#DAD4C6]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1D4ED8]">
              <Megaphone className="w-4 h-4" />
              <span>Digital Marketing &amp; Paid Growth</span>
            </div>
            <h1 className="text-2xl font-bold text-black mt-1 font-display">
              Promote &amp; Monetize Client Websites
            </h1>
            <p className="text-sm text-black mt-1">
              Let website owners pay for marketing packages and ad spend, generate multi-channel AI ad copy, embed tracking pixels, and attribute traffic with UTM links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-2 rounded-lg bg-white border border-[#DAD4C6] text-sm text-black tabular-nums">
              Active Campaigns: <strong>{activeCampaignsCount}</strong> · Paid Volume:{' '}
              <strong>${totalRevenueUsd.toLocaleString()}</strong>
            </div>
            <button
              type="button"
              onClick={onOpenDeploy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#13151A] hover:bg-black text-white text-sm font-semibold cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              <span>Publish Site Updates</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EAE6DC] rounded-lg border border-[#DAD4C6]">
            {(
              [
                ['launch', 'Pay & Launch Campaign', CreditCard],
                ['kit', 'AI Ad & Copy Kit', Sparkles],
                ['tracking', 'Pixels, Promo Bar & UTMs', Tag],
                ['orders', `Campaign Orders (${orders.length})`, Target],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSubTab(id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${
                  subTab === id
                    ? 'bg-white text-black shadow-xs border border-[#DAD4C6]/60'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4 text-[#1D4ED8]" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="mkt-site-select"
              className="text-xs font-semibold uppercase tracking-wide text-black"
            >
              Target Site:
            </label>
            <select
              id="mkt-site-select"
              value={targetSlug}
              onChange={(e) => setTargetSlug(e.target.value)}
              className="rounded-lg border border-[#DAD4C6] bg-white px-3 py-1.5 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              {deployments.length === 0 ? (
                <option value={slugify(project.slug || project.name)}>
                  {project.name} (Draft / Active Canvas)
                </option>
              ) : (
                <>
                  {!deployments.some(
                    (d) => d.slug === slugify(project.slug || project.name)
                  ) && (
                    <option value={slugify(project.slug || project.name)}>
                      {project.name} (Active Canvas)
                    </option>
                  )}
                  {deployments.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} (/sites/{d.slug})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Status Banners */}
        {orderNotice && (
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-sm text-black flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">{orderNotice}</span>
            {pendingCheckoutUrl && (
              <a
                href={pendingCheckoutUrl}
                target="_top"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-sm font-semibold"
              >
                <span>Complete Card Payment</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
        {orderError && (
          <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-sm text-red-700 font-medium">
            {orderError}
          </div>
        )}

        {/* TAB 1: PAY & LAUNCH CAMPAIGN */}
        {subTab === 'launch' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Package Cards */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MARKETING_PACKAGES.map((pkg) => {
                  const active = selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handlePackageSelect(pkg)}
                      className={`text-left p-5 rounded-xl border transition-all flex flex-col cursor-pointer ${
                        active
                          ? 'bg-white border-[#1D4ED8] ring-2 ring-[#1D4ED8]/25 shadow-sm'
                          : 'bg-white border-[#DAD4C6] hover:border-[#13151A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-base font-bold text-black">
                          {pkg.name}
                        </span>
                        {pkg.recommended && (
                          <span className="px-2 py-0.5 rounded bg-[#1D4ED8] text-white text-xs font-semibold shrink-0">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-black mt-1 leading-relaxed">
                        {pkg.tagline}
                      </p>
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-black tabular-nums">
                          ${pkg.priceUsd}
                        </span>
                        <span className="text-xs font-medium text-black">
                          {pkg.billingType === 'monthly'
                            ? '/ month management'
                            : 'one-time setup'}
                        </span>
                      </div>
                      <ul className="mt-3 pt-3 border-t border-[#DAD4C6]/70 space-y-1.5 text-xs text-black">
                        {pkg.deliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-0.5" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {/* Payment Gateway Transparency Notice */}
              <div className="p-4 rounded-xl border border-[#DAD4C6] bg-[#FAF9F5] text-sm text-black leading-relaxed">
                <div className="font-semibold text-black flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#1D4ED8]" />
                  <span>
                    {stripeConfigured
                      ? 'Live Stripe Card Checkout Enabled'
                      : 'Invoice & Order Queue Mode (Add STRIPE_SECRET_KEY for Instant Card Checkout)'}
                  </span>
                </div>
                <p className="text-xs text-black mt-1">
                  {stripeConfigured
                    ? 'Submitting this order creates a real Stripe Checkout session for the package fee plus allocated ad spend, and updates campaign status automatically upon payment.'
                    : 'Orders submitted here are persisted to your database with exact service fees and ad budgets so you can invoice clients or mark them paid. Add STRIPE_SECRET_KEY in Settings > Secrets to accept live card payments via Stripe Checkout.'}
                </p>
              </div>
            </div>

            {/* Order Configuration & Checkout Summary */}
            <form
              onSubmit={handleCheckoutSubmit}
              className="lg:col-span-5 bg-white border border-[#DAD4C6] rounded-xl p-6 space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-black font-display">
                  Campaign Checkout Summary
                </h2>
                <p className="text-xs text-black mt-0.5">
                  Target: <strong>{selectedSiteInfo.name}</strong> (/sites/
                  {selectedSiteInfo.slug})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Customer / Client Billing Email
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="founder@clientcompany.com"
                  className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm text-black placeholder:text-black/60 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1.5">
                  Marketing Channels
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNEL_OPTIONS.map((ch) => {
                    const checked = selectedChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannel(ch)}
                        className={`text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          checked
                            ? 'border-[#1D4ED8] bg-blue-50/60 text-black'
                            : 'border-[#DAD4C6] bg-[#FAF9F5] text-black hover:bg-white'
                        }`}
                      >
                        {checked ? '✓ ' : '+ '}
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Conversion Goal
                  </label>
                  <select
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-2 text-sm text-black"
                  >
                    {GOAL_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Ad Spend Budget (USD)
                  </label>
                  <input
                    type="number"
                    min={selectedPackageId === 'ad_booster' ? 50 : 0}
                    max={25000}
                    step={25}
                    value={adBudgetUsd}
                    onChange={(e) =>
                      setAdBudgetUsd(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Target Audience &amp; Location
                </label>
                <textarea
                  rows={2}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Commercial architects & boutique hotels in New York, 25mi radius"
                  className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm text-black placeholder:text-black/60 resize-none"
                />
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#DAD4C6] space-y-2 text-sm text-black">
                <div className="flex justify-between">
                  <span>{selectedPkg.name}</span>
                  <span className="font-mono font-semibold tabular-nums">
                    ${selectedPkg.priceUsd}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Allocated Ad Spend Pass-Through</span>
                  <span className="font-mono font-semibold tabular-nums">
                    ${adBudgetUsd}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#DAD4C6] flex justify-between text-base font-bold">
                  <span>Total Due</span>
                  <span className="font-mono tabular-nums">
                    ${totalDueUsd.toLocaleString()} USD
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] disabled:bg-blue-400 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {isSubmittingOrder
                    ? 'Processing...'
                    : stripeConfigured
                    ? `Pay $${totalDueUsd.toLocaleString()} via Stripe`
                    : `Create Paid Campaign Order ($${totalDueUsd.toLocaleString()})`}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: AI AD & COPY KIT */}
        {subTab === 'kit' && (
          <div className="space-y-5">
            <div className="bg-white border border-[#DAD4C6] rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-black font-display">
                  AI Multi-Channel Campaign Kit
                </h2>
                <p className="text-sm text-black mt-1">
                  Generate ready-to-run Google Search Ads, Meta social ads, LinkedIn outreach, email broadcasts, and target keywords tailored to{' '}
                  <strong>{selectedSiteInfo.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                disabled={isGeneratingKit}
                onClick={handleGenerateAdKit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] disabled:bg-blue-400 text-white text-sm font-semibold cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGeneratingKit ? 'Generating Campaign Kit...' : 'Generate Ad & Copy Kit'}
                </span>
              </button>
            </div>

            {kitError && (
              <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-sm text-red-700 font-medium">
                {kitError}
              </div>
            )}

            {!adKit ? (
              <div className="bg-white border border-[#DAD4C6] rounded-xl p-10 text-center space-y-2">
                <p className="text-base font-semibold text-black">
                  No campaign kit generated yet
                </p>
                <p className="text-sm text-black max-w-lg mx-auto">
                  Click &ldquo;Generate Ad &amp; Copy Kit&rdquo; above to create channel-ready ad headlines, social copy, email launch copy, and high-intent search keywords from your site sections.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Strategy & Keywords */}
                <div className="bg-white border border-[#DAD4C6] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-black">
                      Positioning &amp; Target Keywords
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(adKit.targetKeywords.join(', '), 'keywords')
                      }
                      className="text-xs font-semibold text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'keywords' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'keywords' ? 'Copied' : 'Copy Keywords'}</span>
                    </button>
                  </div>
                  <p className="text-sm text-black leading-relaxed">{adKit.summary}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {adKit.targetKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[#FAF9F5] border border-[#DAD4C6] text-xs font-medium text-black"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Google Search Ads */}
                <div className="bg-white border border-[#DAD4C6] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-black">
                      Google Search Responsive Ad
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `Headlines:\n${adKit.googleSearchAd.headlines.join('\n')}\n\nDescriptions:\n${adKit.googleSearchAd.descriptions.join('\n')}`,
                          'google-ad'
                        )
                      }
                      className="text-xs font-semibold text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'google-ad' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'google-ad' ? 'Copied' : 'Copy Ad'}</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase text-black">
                      Headlines
                    </div>
                    {adKit.googleSearchAd.headlines.map((h, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded bg-[#FAF9F5] border border-[#DAD4C6] text-sm font-semibold text-[#1D4ED8]"
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase text-black">
                      Descriptions
                    </div>
                    {adKit.googleSearchAd.descriptions.map((d, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded bg-[#FAF9F5] border border-[#DAD4C6] text-sm text-black"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta Ad */}
                <div className="bg-white border border-[#DAD4C6] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-black">
                      Meta (Instagram &amp; Facebook) Ad
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `${adKit.metaSocialAd.primaryText}\n\nHeadline: ${adKit.metaSocialAd.headline}\nCTA: ${adKit.metaSocialAd.callToAction}`,
                          'meta-ad'
                        )
                      }
                      className="text-xs font-semibold text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'meta-ad' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'meta-ad' ? 'Copied' : 'Copy Ad'}</span>
                    </button>
                  </div>
                  <p className="text-sm text-black leading-relaxed whitespace-pre-line">
                    {adKit.metaSocialAd.primaryText}
                  </p>
                  <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#DAD4C6] flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-black">
                      {adKit.metaSocialAd.headline}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-[#13151A] text-white text-xs font-semibold shrink-0">
                      {adKit.metaSocialAd.callToAction}
                    </span>
                  </div>
                </div>

                {/* LinkedIn & Email */}
                <div className="bg-white border border-[#DAD4C6] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-black">
                      Email Launch Broadcast
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `Subject: ${adKit.emailBroadcast.subject}\nPreview: ${adKit.emailBroadcast.previewText}\n\n${adKit.emailBroadcast.body}`,
                          'email-ad'
                        )
                      }
                      className="text-xs font-semibold text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'email-ad' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'email-ad' ? 'Copied' : 'Copy Email'}</span>
                    </button>
                  </div>
                  <div className="text-sm text-black space-y-1.5">
                    <div>
                      <strong>Subject:</strong> {adKit.emailBroadcast.subject}
                    </div>
                    <div>
                      <strong>Preview:</strong> {adKit.emailBroadcast.previewText}
                    </div>
                    <p className="pt-2 border-t border-[#DAD4C6]/70 whitespace-pre-line leading-relaxed">
                      {adKit.emailBroadcast.body}
                    </p>
                  </div>
                </div>

                {/* LinkedIn Post */}
                <div className="bg-white border border-[#DAD4C6] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-black">
                      LinkedIn Sponsored Post
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `${adKit.linkedinPost.hook}\n\n${adKit.linkedinPost.body}\n\n${adKit.linkedinPost.cta}`,
                          'linkedin-ad'
                        )
                      }
                      className="text-xs font-semibold text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'linkedin-ad' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === 'linkedin-ad' ? 'Copied' : 'Copy Post'}</span>
                    </button>
                  </div>
                  <div className="text-sm font-semibold text-black">
                    {adKit.linkedinPost.hook}
                  </div>
                  <p className="text-sm text-black leading-relaxed whitespace-pre-line">
                    {adKit.linkedinPost.body}
                  </p>
                  <div className="text-sm font-semibold text-[#1D4ED8]">
                    {adKit.linkedinPost.cta}
                  </div>
                </div>

                {/* 7-Day Launch Checklist */}
                <div className="bg-white border border-[#DAD4C6] rounded-xl p-5 space-y-3">
                  <h3 className="text-base font-bold text-black">
                    7-Day Launch Action Plan
                  </h3>
                  <ul className="space-y-2 text-sm text-black">
                    {adKit.launchChecklist.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#EAE6DC] text-black shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PIXELS, PROMO BAR & UTM BUILDER */}
        {subTab === 'tracking' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Tracking Pixels & Schema */}
            <div className="bg-white border border-[#DAD4C6] rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-black font-display">
                  Ad Pixels &amp; Analytics Tags
                </h2>
                <p className="text-xs text-black mt-1">
                  Embedded automatically into your exported HTML and live deployed site. Republish after updating IDs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Google Analytics 4 ID
                  </label>
                  <input
                    type="text"
                    value={mkt.ga4MeasurementId || ''}
                    onChange={(e) =>
                      onUpdateMarketing({ ga4MeasurementId: e.target.value })
                    }
                    placeholder="G-XXXXXXXXXX"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black placeholder:text-black/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Google Ads Tag ID
                  </label>
                  <input
                    type="text"
                    value={mkt.googleAdsId || ''}
                    onChange={(e) =>
                      onUpdateMarketing({ googleAdsId: e.target.value })
                    }
                    placeholder="AW-123456789"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black placeholder:text-black/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    Meta (Facebook) Pixel ID
                  </label>
                  <input
                    type="text"
                    value={mkt.metaPixelId || ''}
                    onChange={(e) =>
                      onUpdateMarketing({ metaPixelId: e.target.value })
                    }
                    placeholder="123456789012345"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black placeholder:text-black/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    LinkedIn Partner ID
                  </label>
                  <input
                    type="text"
                    value={mkt.linkedinPartnerId || ''}
                    onChange={(e) =>
                      onUpdateMarketing({ linkedinPartnerId: e.target.value })
                    }
                    placeholder="5678901"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black placeholder:text-black/60"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FAF9F5] border border-[#DAD4C6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(mkt.enableJsonLd)}
                  onChange={(e) =>
                    onUpdateMarketing({ enableJsonLd: e.target.checked })
                  }
                  className="mt-0.5"
                />
                <div className="text-xs text-black leading-relaxed">
                  <span className="font-semibold block">
                    Emit Schema.org JSON-LD Structured Data
                  </span>
                  Helps Google &amp; AI search engines index your site name, description, and canonical URL.
                </div>
              </label>

              {/* Site-wide Promo Announcement Bar */}
              <div className="pt-4 border-t border-[#DAD4C6] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black">
                    Site Promotional Banner
                  </span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-black cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(mkt.announcementEnabled)}
                      onChange={(e) =>
                        onUpdateMarketing({
                          announcementEnabled: e.target.checked,
                        })
                      }
                    />
                    <span>Enable Top Promo Bar</span>
                  </label>
                </div>

                <input
                  type="text"
                  value={mkt.announcementText || ''}
                  onChange={(e) =>
                    onUpdateMarketing({ announcementText: e.target.value })
                  }
                  placeholder="Spring Launch Offer: Book an audit this month and save 20%."
                  className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm text-black placeholder:text-black/60"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={mkt.announcementCtaLabel || ''}
                    onChange={(e) =>
                      onUpdateMarketing({ announcementCtaLabel: e.target.value })
                    }
                    placeholder="Claim Offer"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm text-black placeholder:text-black/60"
                  />
                  <input
                    type="text"
                    value={mkt.announcementCtaHref || ''}
                    onChange={(e) =>
                      onUpdateMarketing({ announcementCtaHref: e.target.value })
                    }
                    placeholder="#contact"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-3 py-2 text-sm font-mono text-black placeholder:text-black/60"
                  />
                </div>
              </div>
            </div>

            {/* UTM Campaign Link Builder */}
            <div className="bg-white border border-[#DAD4C6] rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-black font-display flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Trackable UTM Campaign Link Builder</span>
                </h2>
                <p className="text-xs text-black mt-1">
                  Share these links in Google Ads, Instagram, LinkedIn, or newsletters. Visits automatically attribute in your Analytics Referrers table.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    utm_source
                  </label>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="google"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-2 text-sm font-mono text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    utm_medium
                  </label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="cpc"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-2 text-sm font-mono text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">
                    utm_campaign
                  </label>
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="spring-launch"
                    className="w-full rounded-lg border border-[#DAD4C6] bg-white px-2.5 py-2 text-sm font-mono text-black"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  ['Google Search', 'google', 'cpc'],
                  ['Instagram Bio/Ad', 'instagram', 'paid_social'],
                  ['LinkedIn Post', 'linkedin', 'sponsored'],
                  ['Newsletter', 'newsletter', 'email'],
                ].map(([label, src, med]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setUtmSource(src);
                      setUtmMedium(med);
                    }}
                    className="px-2.5 py-1 rounded-md border border-[#DAD4C6] bg-[#FAF9F5] hover:border-[#1D4ED8] text-xs font-medium text-black cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-lg bg-[#13151A] text-white space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/75">
                  Tracked Destination URL
                </div>
                <div className="text-xs font-mono break-all leading-relaxed">
                  {trackedCampaignUrl}
                </div>
                <button
                  type="button"
                  onClick={() => copyText(trackedCampaignUrl, 'utm-url')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-xs font-semibold cursor-pointer"
                >
                  {copiedKey === 'utm-url' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedKey === 'utm-url' ? 'Copied URL' : 'Copy Campaign URL'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CAMPAIGN ORDERS LEDGER */}
        {subTab === 'orders' && (
          <div className="bg-white border border-[#DAD4C6] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#DAD4C6] bg-[#F8F6F1] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-black">
                  Paid Website Marketing Orders
                </h2>
                <p className="text-xs text-black">
                  Track billing status, allocated ad budgets, channels, and active campaign states.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('launch')}
                className="px-3 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-xs font-semibold cursor-pointer"
              >
                + New Campaign Order
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-10 text-center text-sm text-black">
                No marketing orders yet. Select a package in &ldquo;Pay &amp; Launch Campaign&rdquo; to create your first paid website promotion order.
              </div>
            ) : (
              <div className="divide-y divide-[#DAD4C6]">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5 flex flex-wrap items-start justify-between gap-4 hover:bg-[#FAF9F5]/60"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-black">
                          {order.siteName}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#EAE6DC] text-black">
                          /sites/{order.siteSlug}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                            order.status === 'active'
                              ? 'bg-emerald-100 text-emerald-900'
                              : order.status === 'paid'
                              ? 'bg-blue-100 text-blue-900'
                              : order.status === 'pending_payment'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-[#EAE6DC] text-black'
                          }`}
                        >
                          {formatStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="text-sm text-black">
                        <strong>{order.packageName}</strong> · Billing:{' '}
                        <span className="font-mono">{order.customerEmail}</span> · Goal:{' '}
                        {order.campaignGoal}
                      </div>

                      <div className="text-xs text-black flex flex-wrap items-center gap-3">
                        <span>
                          Channels: <strong>{order.channels.join(', ')}</strong>
                        </span>
                        <span>·</span>
                        <span className="font-mono">
                          UTM: {order.utmCampaign}
                        </span>
                        <span>·</span>
                        <span>
                          Created {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono text-black tabular-nums">
                          ${order.totalUsd.toLocaleString()}
                        </div>
                        <div className="text-xs text-black font-mono tabular-nums">
                          Fee ${order.serviceFeeUsd} + Ad Spend ${order.adBudgetUsd}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {order.status === 'pending_payment' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOrderStatusChange(order.id, 'paid')
                            }
                            className="px-2.5 py-1 rounded bg-[#13151A] hover:bg-black text-white text-xs font-semibold cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        {(order.status === 'paid' || order.status === 'paused') && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOrderStatusChange(order.id, 'active')
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1D4ED8] hover:bg-[#163B9E] text-white text-xs font-semibold cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Activate</span>
                          </button>
                        )}
                        {order.status === 'active' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOrderStatusChange(order.id, 'paused')
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-black text-xs font-semibold cursor-pointer"
                          >
                            <Pause className="w-3 h-3" />
                            <span>Pause</span>
                          </button>
                        )}
                        {order.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOrderStatusChange(order.id, 'completed')
                            }
                            className="px-2.5 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-[#FAF9F5] text-black text-xs font-semibold cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
