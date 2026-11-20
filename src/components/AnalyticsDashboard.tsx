import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  ExternalLink,
  Monitor,
  RefreshCw,
  Rocket,
  Search,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react';
import { AnalyticsPayload } from '../types/builder';

interface AnalyticsDashboardProps {
  onOpenDeploy: () => void;
}

type RangeDays = 7 | 14 | 30 | 90;
type ActivityTab = 'leads' | 'events';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onOpenDeploy,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string>('all');
  const [days, setDays] = useState<RangeDays>(14);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityTab, setActivityTab] = useState<ActivityTab>('leads');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        slug: selectedSlug,
        days: String(days),
      });
      const res = await fetch(`/api/analytics?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load analytics.');
      }
      setData(json as AnalyticsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [selectedSlug, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchAnalytics();
      }
    } catch {
      // Ignore transient error
    }
  };

  const handleDeleteDeployment = async (slug: string) => {
    try {
      const res = await fetch(`/api/deployments/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (selectedSlug === slug) setSelectedSlug('all');
        await fetchAnalytics();
      }
    } catch {
      // Ignore transient error
    }
  };

  const exportCsvReport = () => {
    if (!data) return;
    const header = [
      'Site Name',
      'Client',
      'Slug',
      'Page Views',
      'CTA Clicks',
      'Leads',
      'Conversion Rate (%)',
      'Last Published',
    ];
    const rows = data.sites.map((s) =>
      [
        s.name,
        s.clientName,
        s.slug,
        s.views,
        s.clicks,
        s.leads,
        s.conversionRate.toFixed(1),
        s.deployedAt,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-analytics-${days}d.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filteredSites = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.sites.filter((s) => {
      if (selectedSlug !== 'all' && s.slug !== selectedSlug) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, selectedSlug]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.leads.filter((l) => {
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.siteSlug.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery]);

  const maxSeriesVal = useMemo(() => {
    if (!data || data.series.length === 0) return 4;
    const peak = Math.max(
      ...data.series.map((d) => Math.max(d.views, d.clicks, d.leads))
    );
    return Math.max(peak, 4);
  }, [data]);

  const totalDeviceViews = useMemo(() => {
    if (!data) return 0;
    return data.devices.reduce((acc, item) => acc + item.count, 0);
  }, [data]);

  const activeHoverPoint =
    hoveredIdx !== null && data?.series[hoveredIdx]
      ? data.series[hoveredIdx]
      : null;

  return (
    <main className="flex-1 overflow-y-auto studio-scroll bg-[#F4F2EC] p-6 lg:p-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Website Analytics &amp; Client Performance
            </h1>
            <p className="text-sm text-black mt-1">
              Live traffic, button interactions, and inquiry conversions across deployed client sites.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-black absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter sites or leads..."
                className="pl-9 pr-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-white text-sm text-black placeholder:text-black/60 w-52 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              aria-label="Filter by deployed site"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="rounded-lg border border-[#DAD4C6] bg-white px-3 py-1.5 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Published Sites</option>
              {data?.sites.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} (/{s.slug})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              {([7, 14, 30, 90] as RangeDays[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`px-2.5 py-1 rounded-md text-sm font-mono font-medium transition-colors cursor-pointer tabular-nums ${
                    days === d
                      ? 'bg-white text-black shadow-xs'
                      : 'text-black hover:bg-white/60'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DAD4C6] bg-white hover:bg-slate-50 text-sm font-medium text-black cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportCsvReport}
              disabled={!data || data.sites.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 4-Column Unified KPI Strip */}
        <section className="bg-white border border-[#DAD4C6] rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#DAD4C6]">
          <div className="p-5">
            <div className="text-sm font-medium text-black">
              Page Views ({days}D)
            </div>
            <div className="text-3xl font-bold text-black mt-1.5 tabular-nums font-display">
              {loading && !data ? '—' : (data?.summary.totalViews ?? 0).toLocaleString()}
            </div>
            <div className="text-[13px] text-black mt-1 tabular-nums">
              Across {data?.summary.publishedSitesCount ?? 0} live sites
            </div>
          </div>

          <div className="p-5">
            <div className="text-sm font-medium text-black">
              CTA Clicks
            </div>
            <div className="text-3xl font-bold text-black mt-1.5 tabular-nums font-display">
              {loading && !data ? '—' : (data?.summary.totalClicks ?? 0).toLocaleString()}
            </div>
            <div className="text-[13px] text-black mt-1 tabular-nums">
              Button &amp; link interactions
            </div>
          </div>

          <div className="p-5">
            <div className="text-sm font-medium text-black">
              Captured Leads
            </div>
            <div className="text-3xl font-bold text-black mt-1.5 tabular-nums font-display">
              {loading && !data ? '—' : (data?.summary.totalLeads ?? 0).toLocaleString()}
            </div>
            <div className="text-[13px] text-black mt-1 tabular-nums">
              Verified contact submissions
            </div>
          </div>

          <div className="p-5">
            <div className="text-sm font-medium text-black">
              Conversion Rate
            </div>
            <div className="text-3xl font-bold text-black mt-1.5 tabular-nums font-display">
              {loading && !data
                ? '—'
                : `${(data?.summary.conversionRate ?? 0).toFixed(1)}%`}
            </div>
            <div className="text-[13px] text-black mt-1 tabular-nums">
              Leads divided by views
            </div>
          </div>
        </section>

        {/* Chart & Breakdown Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Traffic & Conversions Chart */}
          <div className="lg:col-span-8 bg-white border border-[#DAD4C6] rounded-xl p-5 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-black">
                  Daily Traffic &amp; Interactions
                </h2>
                <p className="text-sm text-black mt-0.5 tabular-nums">
                  {activeHoverPoint
                    ? `${activeHoverPoint.date} · ${activeHoverPoint.views} views · ${activeHoverPoint.clicks} clicks · ${activeHoverPoint.leads} leads`
                    : `Hover any day column to inspect exact counts (${days} days)`}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-black">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
                  Views
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 inline-block" />
                  Clicks
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                  Leads
                </span>
              </div>
            </div>

            {loading && !data ? (
              <div className="h-56 bg-slate-100 rounded-lg animate-pulse" />
            ) : !data || data.series.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-black">
                No daily points in range.
              </div>
            ) : (
              <div className="h-56 flex flex-col justify-end">
                <div className="flex-1 flex items-end gap-1 pt-4 border-b border-[#DAD4C6]">
                  {data.series.map((pt, i) => {
                    const viewH = Math.round((pt.views / maxSeriesVal) * 100);
                    const clickH = Math.round((pt.clicks / maxSeriesVal) * 100);
                    const leadH = Math.round((pt.leads / maxSeriesVal) * 100);
                    return (
                      <div
                        key={pt.date}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className={`flex-1 h-full flex items-end justify-center gap-[2px] px-[1px] rounded-t transition-colors ${
                          hoveredIdx === i ? 'bg-slate-100' : ''
                        }`}
                      >
                        <div
                          className="w-full max-w-[10px] bg-blue-600 rounded-t-xs transition-all"
                          style={{ height: `${pt.views > 0 ? Math.max(viewH, 4) : 0}%` }}
                          title={`${pt.date}: ${pt.views} views`}
                        />
                        <div
                          className="w-full max-w-[10px] bg-slate-800 rounded-t-xs transition-all"
                          style={{ height: `${pt.clicks > 0 ? Math.max(clickH, 4) : 0}%` }}
                          title={`${pt.date}: ${pt.clicks} clicks`}
                        />
                        <div
                          className="w-full max-w-[10px] bg-emerald-600 rounded-t-xs transition-all"
                          style={{ height: `${pt.leads > 0 ? Math.max(leadH, 4) : 0}%` }}
                          title={`${pt.date}: ${pt.leads} leads`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[13px] font-mono text-black pt-2 tabular-nums">
                  <span>{data.series[0]?.date}</span>
                  <span>
                    {data.series[Math.floor(data.series.length / 2)]?.date}
                  </span>
                  <span>{data.series[data.series.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* Device Split & Top CTAs */}
          <div className="lg:col-span-4 bg-white border border-[#DAD4C6] rounded-xl p-5 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-black">
                Device Breakdown
              </h2>
              <div className="mt-3 space-y-3">
                {(data?.devices || [
                  { device: 'Desktop', count: 0 },
                  { device: 'Tablet', count: 0 },
                  { device: 'Mobile', count: 0 },
                ]).map((item) => {
                  const pct =
                    totalDeviceViews > 0
                      ? Math.round((item.count / totalDeviceViews) * 100)
                      : 0;
                  return (
                    <div key={item.device} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-black">
                          {item.device === 'Desktop' ? (
                            <Monitor className="w-4 h-4 text-black" />
                          ) : item.device === 'Tablet' ? (
                            <Tablet className="w-4 h-4 text-black" />
                          ) : (
                            <Smartphone className="w-4 h-4 text-black" />
                          )}
                          <span>{item.device}</span>
                        </span>
                        <span className="font-mono text-black tabular-nums">
                          {item.count.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#DAD4C6]">
              <h3 className="text-sm font-semibold text-black mb-2.5">
                Top Clicked CTAs
              </h3>
              {!data || data.topCtas.length === 0 ? (
                <p className="text-sm text-black">
                  Button click counts appear once visitors click CTAs on live sites.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.topCtas.map((cta) => (
                    <div
                      key={cta.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-black truncate pr-2">
                        {cta.label}
                      </span>
                      <span className="font-mono text-black font-medium tabular-nums shrink-0">
                        {cta.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Client Site Performance Table */}
        <section className="bg-white border border-[#DAD4C6] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DAD4C6] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-black" />
              <h2 className="text-base font-semibold text-black">
                Deployed Client Sites
              </h2>
            </div>
            <span className="text-sm text-black tabular-nums">
              {filteredSites.length} sites
            </span>
          </div>

          {loading && !data ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-base font-semibold text-black">
                No deployed client sites found
              </p>
              <p className="text-sm text-black max-w-md mx-auto leading-relaxed">
                Deploy a website from the Builder to start collecting real visitor page views, CTA clicks, and contact form conversions.
              </p>
              <button
                type="button"
                onClick={onOpenDeploy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>Deploy Current Site</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DAD4C6] bg-slate-50/70 text-[13px] font-semibold text-black">
                    <th className="py-2.5 px-5">Site</th>
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Live Path</th>
                    <th className="py-2.5 px-4 text-right">Views</th>
                    <th className="py-2.5 px-4 text-right">Clicks</th>
                    <th className="py-2.5 px-4 text-right">Leads</th>
                    <th className="py-2.5 px-4 text-right">Conv.</th>
                    <th className="py-2.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DAD4C6] text-sm">
                  {filteredSites.map((site) => (
                    <tr
                      key={site.slug}
                      className="hover:bg-slate-50/80 transition-colors h-12"
                    >
                      <td className="px-5 font-semibold text-black">
                        {site.name}
                      </td>
                      <td className="px-4 text-black">{site.clientName}</td>
                      <td className="px-4 font-mono text-black">
                        {site.url}
                      </td>
                      <td className="px-4 text-right font-mono tabular-nums text-black">
                        {site.views.toLocaleString()}
                      </td>
                      <td className="px-4 text-right font-mono tabular-nums text-black">
                        {site.clicks.toLocaleString()}
                      </td>
                      <td className="px-4 text-right font-mono tabular-nums text-black font-medium">
                        {site.leads.toLocaleString()}
                      </td>
                      <td className="px-4 text-right font-mono tabular-nums text-black">
                        {site.conversionRate.toFixed(1)}%
                      </td>
                      <td className="px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DAD4C6] bg-white hover:bg-slate-50 text-[13px] font-medium text-black"
                          >
                            <span>Visit</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeployment(site.slug)}
                            title="Unpublish site"
                            className="p-1 rounded text-black hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Leads & Visitor Events */}
        <section className="bg-white border border-[#DAD4C6] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#DAD4C6] flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setActivityTab('leads')}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                  activityTab === 'leads'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                Captured Leads ({filteredLeads.length})
              </button>
              <button
                type="button"
                onClick={() => setActivityTab('events')}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                  activityTab === 'events'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-black hover:bg-white/60'
                }`}
              >
                Visitor Event Log ({data?.recentEvents.length ?? 0})
              </button>
            </div>
          </div>

          {activityTab === 'leads' ? (
            filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-sm text-black">
                No lead submissions recorded in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DAD4C6] bg-slate-50/70 text-[13px] font-semibold text-black">
                      <th className="py-2.5 px-5">Contact</th>
                      <th className="py-2.5 px-4">Site</th>
                      <th className="py-2.5 px-4">Message</th>
                      <th className="py-2.5 px-4 text-right">Submitted</th>
                      <th className="py-2.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DAD4C6] text-sm">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/70 h-12">
                        <td className="px-5">
                          <div className="font-semibold text-black">
                            {lead.name}
                          </div>
                          <div className="text-[13px] text-black">
                            {lead.email}
                          </div>
                        </td>
                        <td className="px-4 font-mono text-black">
                          /{lead.siteSlug}
                        </td>
                        <td className="px-4 text-black max-w-md truncate">
                          {lead.message}
                        </td>
                        <td className="px-4 text-right font-mono text-[13px] text-black tabular-nums whitespace-nowrap">
                          {new Date(lead.submittedAt).toLocaleString()}
                        </td>
                        <td className="px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1 rounded text-black hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Delete lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : !data || data.recentEvents.length === 0 ? (
            <div className="p-8 text-center text-sm text-black">
              No visitor events recorded yet. Open any deployed site URL to generate live traffic events.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DAD4C6] bg-slate-50/70 text-[13px] font-semibold text-black">
                    <th className="py-2.5 px-5">Event</th>
                    <th className="py-2.5 px-4">Site</th>
                    <th className="py-2.5 px-4">Target / Referrer</th>
                    <th className="py-2.5 px-4">Device</th>
                    <th className="py-2.5 px-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DAD4C6] text-sm">
                  {data.recentEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 h-11">
                      <td className="px-5 font-medium text-black">
                        {ev.eventType === 'page_view'
                          ? 'Page View'
                          : ev.eventType === 'cta_click'
                            ? 'CTA Click'
                            : 'Form Submit'}
                      </td>
                      <td className="px-4 font-mono text-black">
                        /{ev.siteSlug}
                      </td>
                      <td className="px-4 text-black">
                        {ev.targetLabel || ev.referrer || 'Direct'}
                      </td>
                      <td className="px-4 capitalize text-black">
                        {ev.deviceType}
                      </td>
                      <td className="px-5 text-right font-mono text-[13px] text-black tabular-nums whitespace-nowrap">
                        {new Date(ev.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
