import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  ImageOff,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { SiteBlock, SiteTheme, ViewportMode } from '../types/builder';

interface CanvasBlockRendererProps {
  block: SiteBlock;
  index: number;
  total: number;
  theme: SiteTheme;
  viewport: ViewportMode;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStartBlock: (e: React.DragEvent, index: number) => void;
  onQuickAiRefine: (id: string) => void;
}

function SafeMedia({
  src,
  alt,
  radius,
  zoomOnHover = false,
}: {
  src: string;
  alt: string;
  radius: string;
  zoomOnHover?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="w-full aspect-[16/10] bg-slate-200/70 border border-slate-300/80 flex flex-col items-center justify-center gap-2 text-black p-6 text-center"
        style={{ borderRadius: radius }}
      >
        <ImageOff className="w-6 h-6" />
        <span className="text-sm font-medium">{alt || 'Visual media slot'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`w-full aspect-[16/10] object-cover block ${
        zoomOnHover
          ? 'transition-transform duration-500 ease-out group-hover/media:scale-[1.03]'
          : ''
      }`}
      style={{ borderRadius: radius }}
    />
  );
}

export const CanvasBlockRenderer: React.FC<CanvasBlockRendererProps> = ({
  block,
  index,
  total,
  theme,
  viewport,
  selected,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
  onDragStartBlock,
  onQuickAiRefine,
}) => {
  const isCompactViewport = viewport === 'mobile';
  const isNarrowViewport = viewport === 'mobile' || viewport === 'tablet';

  const bgStyle: React.CSSProperties =
    block.backgroundVariant === 'contrast'
      ? { backgroundColor: theme.contrastBgColor, color: '#FFFFFF' }
      : block.backgroundVariant === 'surface'
        ? { backgroundColor: theme.surfaceColor, color: theme.textColor }
        : { backgroundColor: theme.backgroundColor, color: theme.textColor };

  const mutedColor =
    block.backgroundVariant === 'contrast'
      ? 'rgba(255, 255, 255, 0.92)'
      : theme.mutedTextColor;

  const cardBorder =
    block.backgroundVariant === 'contrast'
      ? 'rgba(255, 255, 255, 0.14)'
      : theme.borderColor;

  const rhythm = theme.spacing === 'compact' ? 0.78 : theme.spacing === 'airy' ? 1.25 : 1;
  const padY =
    block.paddingY === 'compact'
      ? Math.round(32 * rhythm)
      : block.paddingY === 'spacious'
        ? Math.round(84 * rhythm)
        : Math.round(56 * rhythm);

  const displayStyle: React.CSSProperties = {
    fontFamily: `"${theme.displayFont}", system-ui, sans-serif`,
  };
  const bodyStyle: React.CSSProperties = {
    fontFamily: `"${theme.bodyFont}", system-ui, sans-serif`,
  };

  const motionMode = theme.motion || 'editorial';
  const hasMotion = motionMode !== 'none';
  const enterAnimClass =
    motionMode === 'editorial'
      ? 'af-canvas-enter-editorial'
      : motionMode === 'subtle'
        ? 'af-canvas-enter-subtle'
        : '';
  const enterDelayStyle: React.CSSProperties = hasMotion
    ? { animationDelay: `${Math.min(index, 6) * 45}ms` }
    : {};

  return (
    <div
      draggable
      onDragStart={(e) => onDragStartBlock(e, index)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      className={`group relative transition-shadow duration-150 cursor-pointer ${
        selected
          ? 'ring-2 ring-blue-600 ring-inset z-10'
          : 'hover:ring-1 hover:ring-blue-400/70 hover:ring-inset'
      }`}
      style={{ ...bgStyle, ...bodyStyle }}
    >
      {/* Floating Section Action Bar */}
      <div
        className={`absolute top-2.5 right-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur border border-slate-200 rounded-md px-1.5 py-1 shadow-sm transition-opacity duration-150 ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          title="Drag section to reorder"
          className="cursor-grab active:cursor-grabbing p-1 text-black hover:text-blue-600"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs font-medium text-black px-1.5 select-none whitespace-nowrap">
          {block.label}
        </span>
        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
        <button
          type="button"
          onClick={() => onQuickAiRefine(block.id)}
          title="Refine section with AI"
          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          title="Move section up"
          className="p-1 rounded text-black hover:bg-slate-100 disabled:opacity-30"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          title="Move section down"
          className="p-1 rounded text-black hover:bg-slate-100 disabled:opacity-30"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(block.id)}
          title="Duplicate section"
          className="p-1 rounded text-black hover:bg-slate-100"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          title="Remove section"
          className="p-1 rounded text-black hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Block Body */}
      {block.type === 'navbar' && (
        <header
          className="px-6 py-4"
          style={{ borderBottom: `1px solid ${cardBorder}` }}
        >
          <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-6">
            <span
              className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
              style={displayStyle}
            >
              {block.props.brandName}
            </span>
            {!isCompactViewport && (
              <nav className="flex items-center gap-6 text-base font-medium overflow-hidden">
                {block.props.links.map((link, idx) => (
                  <span
                    key={idx}
                    className="whitespace-nowrap"
                  >
                    {link.label}
                  </span>
                ))}
              </nav>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="px-4 py-2 text-sm font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.accentTextColor,
                  borderRadius: theme.radius,
                }}
              >
                {block.props.ctaLabel}
              </span>
              {isCompactViewport && (
                <span
                  className="px-2.5 py-1.5 text-sm font-medium border"
                  style={{ borderColor: cardBorder, borderRadius: theme.radius }}
                >
                  Menu
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {block.type === 'hero' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          {block.props.layout === 'banner' && block.props.imageUrl ? (
            <div
              className="group/media max-w-[1160px] mx-auto relative overflow-hidden flex items-end border"
              style={{
                minHeight: isCompactViewport ? '380px' : '480px',
                padding: isCompactViewport ? '28px' : '52px',
                borderRadius: theme.radius,
                borderColor: 'rgba(255,255,255,0.14)',
              }}
            >
              <img
                src={block.props.imageUrl}
                alt={block.props.imageAlt || block.props.headline}
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-cover ${
                  hasMotion
                    ? 'transition-transform duration-700 ease-out group-hover/media:scale-[1.03]'
                    : ''
                }`}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(100deg, rgba(13,15,20,0.92) 0%, rgba(13,15,20,0.74) 54%, rgba(13,15,20,0.35) 100%)',
                }}
              />
              <div className="relative z-10 max-w-2xl text-white">
                {block.props.kicker && (
                  <p className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3 text-white/90">
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.kicker}</span>
                  </p>
                )}
                <h1
                  className={`font-bold tracking-tight leading-[1.06] mb-5 [text-wrap:balance] ${
                    isCompactViewport ? 'text-4xl' : 'text-[2.65rem] lg:text-[3.35rem]'
                  }`}
                  style={displayStyle}
                >
                  {block.props.headline}
                </h1>
                <p className="text-lg leading-relaxed mb-7 max-w-[54ch] text-white/90">
                  {block.props.subtitle}
                </p>
                <div className="flex flex-wrap gap-3">
                  <span
                    className="px-6 py-3 text-base font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.accentTextColor,
                      borderRadius: theme.radius,
                    }}
                  >
                    {block.props.primaryCtaLabel}
                  </span>
                  {block.props.secondaryCtaLabel && (
                    <span
                      className="px-6 py-3 text-base font-semibold border whitespace-nowrap text-white"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderColor: 'rgba(255,255,255,0.34)',
                        borderRadius: theme.radius,
                      }}
                    >
                      {block.props.secondaryCtaLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`max-w-[1160px] mx-auto ${
                block.props.layout === 'centered'
                  ? 'flex flex-col items-center text-center'
                  : isNarrowViewport
                    ? 'grid grid-cols-1 gap-8 items-center'
                    : 'grid grid-cols-12 gap-12 items-center'
              }`}
            >
              <div
                className={
                  block.props.layout === 'centered'
                    ? 'max-w-2xl'
                    : isNarrowViewport
                      ? ''
                      : 'col-span-6'
                }
              >
                {block.props.kicker && (
                  <p
                    className={`inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3.5 ${
                      block.props.layout === 'centered' ? 'justify-center' : ''
                    }`}
                    style={{ color: mutedColor }}
                  >
                    <span
                      className="w-5 h-0.5 shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span>{block.props.kicker}</span>
                  </p>
                )}
                <h1
                  className={`font-bold tracking-tight leading-[1.06] mb-5 [text-wrap:balance] ${
                    isCompactViewport ? 'text-4xl' : 'text-[2.65rem] lg:text-[3.35rem]'
                  }`}
                  style={displayStyle}
                >
                  {block.props.headline}
                </h1>
                <p
                  className="text-lg leading-relaxed mb-7 max-w-[54ch]"
                  style={{
                    color: mutedColor,
                    marginInline: block.props.layout === 'centered' ? 'auto' : undefined,
                  }}
                >
                  {block.props.subtitle}
                </p>
                <div
                  className={`flex flex-wrap gap-3 ${
                    block.props.layout === 'centered' ? 'justify-center' : ''
                  }`}
                >
                  <span
                    className="px-6 py-3 text-base font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.accentTextColor,
                      borderRadius: theme.radius,
                    }}
                  >
                    {block.props.primaryCtaLabel}
                  </span>
                  {block.props.secondaryCtaLabel && (
                    <span
                      className="px-6 py-3 text-base font-semibold border whitespace-nowrap"
                      style={{
                        borderColor: cardBorder,
                        borderRadius: theme.radius,
                      }}
                    >
                      {block.props.secondaryCtaLabel}
                    </span>
                  )}
                </div>
              </div>
              {block.props.imageUrl && (
                <div
                  className={
                    block.props.layout === 'centered'
                      ? 'w-full max-w-4xl mt-12'
                      : isNarrowViewport
                        ? 'w-full'
                        : 'col-span-6'
                  }
                >
                  <div
                    className="group/media overflow-hidden border"
                    style={{
                      borderColor: cardBorder,
                      borderRadius: theme.radius,
                      boxShadow:
                        block.backgroundVariant === 'contrast'
                          ? '0 28px 56px -24px rgba(0,0,0,0.55)'
                          : '0 24px 48px -24px rgba(15,23,42,0.22)',
                    }}
                  >
                    <SafeMedia
                      src={block.props.imageUrl}
                      alt={block.props.imageAlt}
                      radius="0px"
                      zoomOnHover={hasMotion}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {block.type === 'stats' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div className="max-w-[1160px] mx-auto">
            {block.props.heading && (
              <h2
                className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-4"
                style={{ color: mutedColor }}
              >
                <span
                  className="w-5 h-0.5 shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <span>{block.props.heading}</span>
              </h2>
            )}
            <div
              className={`grid ${
                isCompactViewport
                  ? 'grid-cols-1 divide-y'
                  : isNarrowViewport
                    ? 'grid-cols-2'
                    : 'grid-cols-4 divide-x'
              }`}
              style={{
                borderTop: `1px solid ${cardBorder}`,
                borderBottom: `1px solid ${cardBorder}`,
                borderColor: cardBorder,
              }}
            >
              {block.props.items.map((item, i) => (
                <div
                  key={i}
                  className={`py-7 ${!isCompactViewport && i > 0 ? 'px-6' : 'pr-6'}`}
                  style={{ borderColor: cardBorder }}
                >
                  <div
                    className="text-3xl lg:text-4xl font-bold tabular-nums tracking-tight"
                    style={displayStyle}
                  >
                    {item.value}
                  </div>
                  <div className="text-base font-semibold mt-2">{item.label}</div>
                  <div className="text-sm mt-1" style={{ color: mutedColor }}>
                    {item.context}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {block.type === 'features' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div className="max-w-[1160px] mx-auto">
            <div className="max-w-2xl mb-11">
              {block.props.eyebrow && (
                <p
                  className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                  style={{ color: mutedColor }}
                >
                  <span
                    className="w-5 h-0.5 shrink-0"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span>{block.props.eyebrow}</span>
                </p>
              )}
              <h2
                className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                style={displayStyle}
              >
                {block.props.heading}
              </h2>
              {block.props.intro && (
                <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                  {block.props.intro}
                </p>
              )}
            </div>
            <div
              className={`grid gap-6 ${
                isCompactViewport
                  ? 'grid-cols-1'
                  : isNarrowViewport
                    ? 'grid-cols-2'
                    : block.props.columns === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
              }`}
            >
              {block.props.items.map((item, i) => (
                <div
                  key={i}
                  className={`p-7 border ${hasMotion ? 'af-hover-lift' : ''}`}
                  style={{
                    borderColor: cardBorder,
                    borderRadius: theme.radius,
                    backgroundColor:
                      block.backgroundVariant === 'contrast'
                        ? 'rgba(255,255,255,0.05)'
                        : theme.backgroundColor,
                  }}
                >
                  {item.meta && (
                    <p
                      className="text-sm font-semibold pb-3 mb-3.5"
                      style={{
                        color:
                          block.backgroundVariant === 'contrast'
                            ? 'rgba(255,255,255,0.88)'
                            : theme.primaryColor,
                        borderBottom: `1px solid ${cardBorder}`,
                      }}
                    >
                      {item.meta}
                    </p>
                  )}
                  <h3 className="text-xl font-bold mb-2.5 tracking-tight" style={displayStyle}>
                    {item.title}
                  </h3>
                  <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {block.type === 'showcase' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div
            className={`max-w-[1160px] mx-auto grid gap-12 items-center ${
              isNarrowViewport ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            <div
              className={
                !isNarrowViewport && block.props.imagePosition === 'left'
                  ? 'order-2'
                  : ''
              }
            >
              {block.props.eyebrow && (
                <p
                  className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                  style={{ color: mutedColor }}
                >
                  <span
                    className="w-5 h-0.5 shrink-0"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span>{block.props.eyebrow}</span>
                </p>
              )}
              <h2
                className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 [text-wrap:balance]"
                style={displayStyle}
              >
                {block.props.heading}
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: mutedColor }}>
                {block.props.body}
              </p>
              {block.props.bullets.length > 0 && (
                <ul
                  className="space-y-3 text-base mb-7"
                  style={{ color: mutedColor }}
                >
                  {block.props.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="font-bold shrink-0"
                        style={{
                          color:
                            block.backgroundVariant === 'contrast'
                              ? '#FFFFFF'
                              : theme.primaryColor,
                        }}
                      >
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {block.props.ctaLabel && (
                <span
                  className="inline-flex px-5 py-2.5 text-base font-semibold border"
                  style={{
                    borderColor: cardBorder,
                    borderRadius: theme.radius,
                  }}
                >
                  {block.props.ctaLabel}
                </span>
              )}
            </div>
            <div
              className={
                !isNarrowViewport && block.props.imagePosition === 'left'
                  ? 'order-1'
                  : ''
              }
            >
              <div
                className="group/media overflow-hidden border"
                style={{
                  borderColor: cardBorder,
                  borderRadius: theme.radius,
                  boxShadow:
                    block.backgroundVariant === 'contrast'
                      ? '0 28px 56px -24px rgba(0,0,0,0.55)'
                      : '0 24px 48px -24px rgba(15,23,42,0.22)',
                }}
              >
                <SafeMedia
                  src={block.props.imageUrl}
                  alt={block.props.imageAlt}
                  radius="0px"
                  zoomOnHover={hasMotion}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {block.type === 'pricing' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div className="max-w-[1160px] mx-auto">
            <div className="max-w-2xl mb-11">
              {block.props.eyebrow && (
                <p
                  className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                  style={{ color: mutedColor }}
                >
                  <span
                    className="w-5 h-0.5 shrink-0"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span>{block.props.eyebrow}</span>
                </p>
              )}
              <h2
                className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                style={displayStyle}
              >
                {block.props.heading}
              </h2>
              {block.props.intro && (
                <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                  {block.props.intro}
                </p>
              )}
            </div>
            <div
              className={`grid gap-6 items-stretch ${
                isNarrowViewport
                  ? 'grid-cols-1'
                  : block.props.tiers.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
              }`}
            >
              {block.props.tiers.map((tier, i) => (
                <div
                  key={i}
                  className={`p-8 border flex flex-col ${hasMotion ? 'af-hover-lift' : ''}`}
                  style={{
                    borderColor: tier.highlighted ? theme.primaryColor : cardBorder,
                    borderTopWidth: tier.highlighted ? '3px' : '1px',
                    boxShadow: tier.highlighted
                      ? '0 20px 44px -24px rgba(15,23,42,0.22)'
                      : undefined,
                    borderRadius: theme.radius,
                    backgroundColor:
                      block.backgroundVariant === 'contrast'
                        ? 'rgba(255,255,255,0.05)'
                        : theme.backgroundColor,
                  }}
                >
                  {tier.highlighted && (
                    <p
                      className="text-xs font-bold tracking-wide mb-2"
                      style={{ color: theme.primaryColor }}
                    >
                      Recommended
                    </p>
                  )}
                  <h3 className="text-xl font-bold" style={displayStyle}>
                    {tier.name}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: mutedColor }}>
                    {tier.audience}
                  </p>
                  <div className="flex items-baseline gap-2 my-5">
                    <span
                      className="text-4xl font-bold tabular-nums tracking-tight"
                      style={displayStyle}
                    >
                      {tier.price}
                    </span>
                    <span className="text-sm" style={{ color: mutedColor }}>
                      {tier.cadence}
                    </span>
                  </div>
                  <p className="text-base" style={{ color: mutedColor }}>
                    {tier.description}
                  </p>
                  <div
                    className="h-px my-5"
                    style={{ backgroundColor: cardBorder }}
                  />
                  <ul className="space-y-2.5 text-base mb-7 flex-1">
                    {tier.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5">
                        <span
                          className="font-bold shrink-0"
                          style={{ color: theme.primaryColor }}
                        >
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <span
                    className="w-full py-3 px-4 text-center text-base font-semibold border"
                    style={
                      tier.highlighted
                        ? {
                            backgroundColor: theme.primaryColor,
                            color: theme.accentTextColor,
                            borderColor: theme.primaryColor,
                            borderRadius: theme.radius,
                          }
                        : {
                            borderColor: cardBorder,
                            borderRadius: theme.radius,
                          }
                    }
                  >
                    {tier.ctaLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {block.type === 'testimonial' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div className="max-w-[900px] mx-auto">
            <div
              className="text-5xl leading-none mb-3"
              style={{
                ...displayStyle,
                color:
                  block.backgroundVariant === 'contrast'
                    ? 'rgba(255,255,255,0.45)'
                    : theme.primaryColor,
              }}
              aria-hidden="true"
            >
              “
            </div>
            <blockquote
              className="text-3xl lg:text-4xl font-medium leading-snug tracking-tight mb-7"
              style={displayStyle}
            >
              {block.props.quote}
            </blockquote>
            <div
              className="pt-5 flex flex-wrap items-center justify-between gap-3"
              style={{ borderTop: `1px solid ${cardBorder}` }}
            >
              <div className="flex flex-wrap items-center gap-2 text-base">
                <strong className="font-semibold">{block.props.authorName}</strong>
                <span style={{ color: mutedColor }}>
                  {block.props.authorRole} · {block.props.company}
                </span>
              </div>
              {block.props.outcome && (
                <p className="text-sm font-medium" style={{ color: mutedColor }}>
                  {block.props.outcome}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {block.type === 'faq' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div className="max-w-[820px] mx-auto">
            {block.props.eyebrow && (
              <p
                className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                style={{ color: mutedColor }}
              >
                <span
                  className="w-5 h-0.5 shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <span>{block.props.eyebrow}</span>
              </p>
            )}
            <h2
              className="text-3xl lg:text-4xl font-bold tracking-tight mb-8"
              style={displayStyle}
            >
              {block.props.heading}
            </h2>
            <div style={{ borderTop: `1px solid ${cardBorder}` }}>
              {block.props.items.map((item, i) => (
                <div
                  key={i}
                  className="py-5"
                  style={{ borderBottom: `1px solid ${cardBorder}` }}
                >
                  <div
                    className="font-semibold text-lg mb-2 flex items-center justify-between gap-4"
                    style={displayStyle}
                  >
                    <span>{item.question}</span>
                    <span className="text-xl font-normal shrink-0">+</span>
                  </div>
                  <p className="text-base leading-relaxed max-w-[66ch]" style={{ color: mutedColor }}>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {block.type === 'cta' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div
            className="max-w-[1160px] mx-auto p-10 lg:p-12 border flex flex-wrap items-center justify-between gap-8"
            style={{
              borderColor: cardBorder,
              borderRadius: theme.radius,
              backgroundColor:
                block.backgroundVariant === 'contrast'
                  ? 'rgba(255,255,255,0.04)'
                  : undefined,
            }}
          >
            <div className="max-w-xl">
              <h2
                className="text-3xl lg:text-4xl font-bold tracking-tight mb-3 [text-wrap:balance]"
                style={displayStyle}
              >
                {block.props.headline}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: mutedColor }}>
                {block.props.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span
                className="px-6 py-3 text-base font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.accentTextColor,
                  borderRadius: theme.radius,
                }}
              >
                {block.props.primaryCtaLabel}
              </span>
              {block.props.secondaryCtaLabel && (
                <span
                  className="px-6 py-3 text-base font-semibold border whitespace-nowrap"
                  style={{ borderColor: cardBorder, borderRadius: theme.radius }}
                >
                  {block.props.secondaryCtaLabel}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {block.type === 'contact' && (
        <section
          className={`px-7 ${enterAnimClass}`}
          style={{ paddingBlock: `${padY}px`, ...enterDelayStyle }}
        >
          <div
            className={`max-w-[1160px] mx-auto grid gap-12 items-start ${
              isNarrowViewport ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            <div>
              {block.props.eyebrow && (
                <p
                  className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-wide mb-3"
                  style={{ color: mutedColor }}
                >
                  <span
                    className="w-5 h-0.5 shrink-0"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <span>{block.props.eyebrow}</span>
                </p>
              )}
              <h2
                className="text-3xl lg:text-4xl font-bold tracking-tight mb-3"
                style={displayStyle}
              >
                {block.props.heading}
              </h2>
              <p className="text-base leading-relaxed mb-7" style={{ color: mutedColor }}>
                {block.props.description}
              </p>
              <div style={{ borderTop: `1px solid ${cardBorder}` }}>
                <div className="py-4" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <div className="text-sm font-semibold" style={{ color: mutedColor }}>
                    Email
                  </div>
                  <div className="font-medium mt-0.5 text-base">{block.props.email}</div>
                </div>
                <div className="py-4" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <div className="text-sm font-semibold" style={{ color: mutedColor }}>
                    Studio
                  </div>
                  <div className="font-medium mt-0.5 text-base">{block.props.location}</div>
                </div>
              </div>
            </div>
            <div
              className="p-7 border space-y-4"
              style={{
                borderColor: cardBorder,
                borderRadius: theme.radius,
                boxShadow: '0 20px 44px -26px rgba(15,23,42,0.16)',
                backgroundColor:
                  block.backgroundVariant === 'contrast'
                    ? 'rgba(255,255,255,0.06)'
                    : theme.backgroundColor,
              }}
            >
              <div>
                <div className="text-sm font-medium mb-1">Full Name</div>
                <div
                  className="h-11 px-3.5 border flex items-center text-sm bg-white text-black"
                  style={{ borderColor: theme.borderColor, borderRadius: theme.radius }}
                >
                  Alex Morgan
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Work Email</div>
                <div
                  className="h-11 px-3.5 border flex items-center text-sm bg-white text-black"
                  style={{ borderColor: theme.borderColor, borderRadius: theme.radius }}
                >
                  alex@company.com
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Project Brief</div>
                <div
                  className="h-24 p-3.5 border text-sm bg-white text-black"
                  style={{ borderColor: theme.borderColor, borderRadius: theme.radius }}
                >
                  Share scope, timeline, and goals...
                </div>
              </div>
              <span
                className="w-full inline-flex justify-center px-5 py-3 text-base font-semibold"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.accentTextColor,
                  borderRadius: theme.radius,
                }}
              >
                {block.props.submitLabel}
              </span>
            </div>
          </div>
        </section>
      )}

      {block.type === 'footer' && (
        <footer
          className="px-7"
          style={{
            paddingBlock: `${padY}px`,
            borderTop: `1px solid ${cardBorder}`,
          }}
        >
          <div className="max-w-[1160px] mx-auto">
            <div
              className={`grid gap-10 ${
                isNarrowViewport ? 'grid-cols-1' : 'grid-cols-4'
              }`}
            >
              <div className={isNarrowViewport ? '' : 'col-span-2'}>
                <div className="text-lg font-bold" style={displayStyle}>
                  {block.props.brandName}
                </div>
                <p
                  className="text-base mt-3 max-w-xs leading-relaxed"
                  style={{ color: mutedColor }}
                >
                  {block.props.summary}
                </p>
              </div>
              {block.props.columns.map((col, ci) => (
                <div key={ci}>
                  <div className="text-sm font-semibold mb-3">{col.heading}</div>
                  <ul className="space-y-2.5 text-base" style={{ color: mutedColor }}>
                    {col.links.map((l, li) => (
                      <li key={li}>{l.label}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div
              className="mt-10 pt-6 text-sm"
              style={{
                borderTop: `1px solid ${cardBorder}`,
                color: mutedColor,
              }}
            >
              {block.props.copyright}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
