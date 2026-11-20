import {
  BackgroundVariant,
  ExportOptions,
  PaddingSize,
  SiteBlock,
  SiteProject,
  SiteTheme,
} from '../types/builder';

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeCssColor(val: string, fallback: string): string {
  return /^#[0-9a-fA-F]{3,8}$|^rgba?\([^)]+\)$/.test(val.trim()) ? val.trim() : fallback;
}

function safeFontName(val: string, fallback: string): string {
  const clean = val.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  return clean || fallback;
}

function getGoogleFontsUrl(theme: SiteTheme): string {
  const fonts = Array.from(
    new Set([
      safeFontName(theme.displayFont, 'Plus Jakarta Sans'),
      safeFontName(theme.bodyFont, 'DM Sans'),
    ])
  );
  const query = fonts
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

function sectionBgClass(variant: BackgroundVariant, p: string): string {
  if (variant === 'surface') return `${p}bg-surface`;
  if (variant === 'contrast') return `${p}bg-contrast`;
  return `${p}bg-canvas`;
}

function sectionPadClass(pad: PaddingSize, p: string): string {
  if (pad === 'compact') return `${p}py-compact`;
  if (pad === 'spacious') return `${p}py-spacious`;
  return `${p}py-normal`;
}

function renderBlockHtml(block: SiteBlock, p: string): string {
  const bgCls = sectionBgClass(block.backgroundVariant, p);
  const padCls = sectionPadClass(block.paddingY, p);

  switch (block.type) {
    case 'navbar': {
      const linksHtml = block.props.links
        .map(
          (l) =>
            `<a href="${escapeHtml(l.href)}" class="${p}nav-link">${escapeHtml(l.label)}</a>`
        )
        .join('\n          ');
      return `  <header class="${p}navbar ${bgCls}">
    <div class="${p}container ${p}navbar-inner">
      <a href="#" class="${p}brand">${escapeHtml(block.props.brandName)}</a>
      <nav class="${p}nav-links" aria-label="Primary navigation">
          ${linksHtml}
      </nav>
      <div class="${p}nav-actions">
        <a href="${escapeHtml(block.props.ctaHref)}" class="${p}btn ${p}btn-primary ${p}btn-sm">${escapeHtml(
        block.props.ctaLabel
      )}</a>
        <button type="button" class="${p}menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">Menu</button>
      </div>
    </div>
  </header>`;
    }

    case 'hero': {
      const isCentered = block.props.layout === 'centered';
      const isBanner = block.props.layout === 'banner' && Boolean(block.props.imageUrl);
      if (isBanner) {
        return `  <section class="${p}section ${p}hero ${p}hero-banner-wrap ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}hero-banner">
        <img src="${escapeHtml(block.props.imageUrl)}" alt="${escapeHtml(
          block.props.imageAlt || block.props.headline
        )}" class="${p}hero-banner-bg" loading="eager" />
        <div class="${p}hero-banner-scrim" aria-hidden="true"></div>
        <div class="${p}hero-banner-content">
          ${
            block.props.kicker
              ? `<p class="${p}kicker ${p}kicker-on-dark">${escapeHtml(block.props.kicker)}</p>`
              : ''
          }
          <h1 class="${p}hero-title">${escapeHtml(block.props.headline)}</h1>
          <p class="${p}hero-subtitle">${escapeHtml(block.props.subtitle)}</p>
          <div class="${p}btn-group">
            <a href="${escapeHtml(block.props.primaryCtaHref)}" class="${p}btn ${p}btn-primary">${escapeHtml(
          block.props.primaryCtaLabel
        )}</a>
            ${
              block.props.secondaryCtaLabel
                ? `<a href="${escapeHtml(block.props.secondaryCtaHref)}" class="${p}btn ${p}btn-secondary-on-dark">${escapeHtml(
                    block.props.secondaryCtaLabel
                  )}</a>`
                : ''
            }
          </div>
        </div>
      </div>
    </div>
  </section>`;
      }
      return `  <section class="${p}section ${p}hero ${bgCls} ${padCls}">
    <div class="${p}container ${isCentered ? `${p}hero-centered` : `${p}hero-split`}">
      <div class="${p}hero-copy">
        ${
          block.props.kicker
            ? `<p class="${p}kicker">${escapeHtml(block.props.kicker)}</p>`
            : ''
        }
        <h1 class="${p}hero-title">${escapeHtml(block.props.headline)}</h1>
        <p class="${p}hero-subtitle">${escapeHtml(block.props.subtitle)}</p>
        <div class="${p}btn-group">
          <a href="${escapeHtml(block.props.primaryCtaHref)}" class="${p}btn ${p}btn-primary">${escapeHtml(
        block.props.primaryCtaLabel
      )}</a>
          ${
            block.props.secondaryCtaLabel
              ? `<a href="${escapeHtml(block.props.secondaryCtaHref)}" class="${p}btn ${p}btn-secondary">${escapeHtml(
                  block.props.secondaryCtaLabel
                )}</a>`
              : ''
          }
        </div>
      </div>
      ${
        block.props.imageUrl
          ? `<div class="${p}hero-media">
        <div class="${p}media-frame">
          <img src="${escapeHtml(block.props.imageUrl)}" alt="${escapeHtml(
              block.props.imageAlt || block.props.headline
            )}" class="${p}media-img" loading="eager" />
        </div>
      </div>`
          : ''
      }
    </div>
  </section>`;
    }

    case 'stats': {
      const itemsHtml = block.props.items
        .map(
          (item) => `      <div class="${p}stat-item ${p}reveal">
        <div class="${p}stat-value">${escapeHtml(item.value)}</div>
        <div class="${p}stat-label">${escapeHtml(item.label)}</div>
        <div class="${p}stat-context">${escapeHtml(item.context)}</div>
      </div>`
        )
        .join('\n');
      return `  <section id="metrics" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      ${
        block.props.heading
          ? `<h2 class="${p}eyebrow ${p}mb-sm ${p}reveal">${escapeHtml(block.props.heading)}</h2>`
          : ''
      }
      <div class="${p}stats-grid">
${itemsHtml}
      </div>
    </div>
  </section>`;
    }

    case 'features': {
      const colsCls = block.props.columns === 2 ? `${p}grid-2` : `${p}grid-3`;
      const itemsHtml = block.props.items
        .map(
          (item) => `      <article class="${p}card ${p}reveal">
        ${item.meta ? `<p class="${p}card-meta">${escapeHtml(item.meta)}</p>` : ''}
        <h3 class="${p}card-title">${escapeHtml(item.title)}</h3>
        <p class="${p}card-body">${escapeHtml(item.description)}</p>
      </article>`
        )
        .join('\n');
      return `  <section id="approach" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        ${
          block.props.intro
            ? `<p class="${p}section-intro">${escapeHtml(block.props.intro)}</p>`
            : ''
        }
      </div>
      <div class="${colsCls}">
${itemsHtml}
      </div>
    </div>
  </section>`;
    }

    case 'showcase': {
      const reverseCls = block.props.imagePosition === 'left' ? `${p}split-reverse` : '';
      const bulletsHtml = block.props.bullets
        .map((b) => `          <li>${escapeHtml(b)}</li>`)
        .join('\n');
      return `  <section id="work" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${p}split ${reverseCls}">
      <div class="${p}split-copy ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        <p class="${p}section-intro">${escapeHtml(block.props.body)}</p>
        ${bulletsHtml ? `<ul class="${p}check-list">\n${bulletsHtml}\n        </ul>` : ''}
        ${
          block.props.ctaLabel
            ? `<div class="${p}mt-md"><a href="${escapeHtml(
                block.props.ctaHref
              )}" class="${p}btn ${p}btn-secondary">${escapeHtml(block.props.ctaLabel)}</a></div>`
            : ''
        }
      </div>
      <div class="${p}split-media ${p}reveal">
        <div class="${p}media-frame">
          <img src="${escapeHtml(block.props.imageUrl)}" alt="${escapeHtml(
        block.props.imageAlt || block.props.heading
      )}" class="${p}media-img" loading="lazy" />
        </div>
      </div>
    </div>
  </section>`;
    }

    case 'pricing': {
      const tiersHtml = block.props.tiers
        .map((tier) => {
          const featuresHtml = tier.features
            .map((f) => `          <li>${escapeHtml(f)}</li>`)
            .join('\n');
          return `      <div class="${p}pricing-card ${tier.highlighted ? `${p}pricing-featured` : ''} ${p}reveal">
        <div class="${p}pricing-header">
          ${
            tier.highlighted
              ? `<p class="${p}pricing-kicker">Recommended</p>`
              : ''
          }
          <h3 class="${p}card-title">${escapeHtml(tier.name)}</h3>
          <p class="${p}pricing-audience">${escapeHtml(tier.audience)}</p>
        </div>
        <div class="${p}pricing-price-row">
          <span class="${p}pricing-amount">${escapeHtml(tier.price)}</span>
          <span class="${p}pricing-cadence">${escapeHtml(tier.cadence)}</span>
        </div>
        <p class="${p}card-body">${escapeHtml(tier.description)}</p>
        <div class="${p}pricing-divider"></div>
        <ul class="${p}pricing-list">
${featuresHtml}
        </ul>
        <a href="#contact" class="${p}btn ${
            tier.highlighted ? `${p}btn-primary` : `${p}btn-secondary`
          } ${p}btn-full">${escapeHtml(tier.ctaLabel)}</a>
      </div>`;
        })
        .join('\n');
      return `  <section id="pricing" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        ${
          block.props.intro
            ? `<p class="${p}section-intro">${escapeHtml(block.props.intro)}</p>`
            : ''
        }
      </div>
      <div class="${p}pricing-grid">
${tiersHtml}
      </div>
    </div>
  </section>`;
    }

    case 'testimonial': {
      return `  <section class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${p}quote-wrap ${p}reveal">
      <div class="${p}quote-mark" aria-hidden="true">“</div>
      <blockquote class="${p}quote-text">${escapeHtml(block.props.quote)}</blockquote>
      <div class="${p}quote-footer">
        <div class="${p}quote-meta">
          <strong>${escapeHtml(block.props.authorName)}</strong>
          <span>${escapeHtml(block.props.authorRole)} · ${escapeHtml(block.props.company)}</span>
        </div>
        ${
          block.props.outcome
            ? `<p class="${p}quote-outcome">${escapeHtml(block.props.outcome)}</p>`
            : ''
        }
      </div>
    </div>
  </section>`;
    }

    case 'faq': {
      const faqHtml = block.props.items
        .map(
          (item) => `      <details class="${p}faq-item ${p}reveal">
        <summary class="${p}faq-question"><span>${escapeHtml(item.question)}</span></summary>
        <p class="${p}faq-answer">${escapeHtml(item.answer)}</p>
      </details>`
        )
        .join('\n');
      return `  <section id="faq" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${p}narrow">
      <div class="${p}section-head ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
      </div>
      <div class="${p}faq-list">
${faqHtml}
      </div>
    </div>
  </section>`;
    }

    case 'cta': {
      return `  <section class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container">
      <div class="${p}cta-panel ${p}reveal">
        <div class="${p}cta-copy">
          <h2 class="${p}section-title">${escapeHtml(block.props.headline)}</h2>
          <p class="${p}section-intro">${escapeHtml(block.props.description)}</p>
        </div>
        <div class="${p}btn-group">
          <a href="${escapeHtml(block.props.primaryCtaHref)}" class="${p}btn ${p}btn-primary">${escapeHtml(
        block.props.primaryCtaLabel
      )}</a>
          ${
            block.props.secondaryCtaLabel
              ? `<a href="${escapeHtml(block.props.secondaryCtaHref)}" class="${p}btn ${p}btn-secondary">${escapeHtml(
                  block.props.secondaryCtaLabel
                )}</a>`
              : ''
          }
        </div>
      </div>
    </div>
  </section>`;
    }

    case 'contact': {
      return `  <section id="contact" class="${p}section ${bgCls} ${padCls}">
    <div class="${p}container ${p}split ${p}contact-split">
      <div class="${p}split-copy ${p}reveal">
        ${
          block.props.eyebrow
            ? `<p class="${p}eyebrow">${escapeHtml(block.props.eyebrow)}</p>`
            : ''
        }
        <h2 class="${p}section-title">${escapeHtml(block.props.heading)}</h2>
        <p class="${p}section-intro">${escapeHtml(block.props.description)}</p>
        <dl class="${p}contact-details">
          <div>
            <dt>Email</dt>
            <dd><a href="mailto:${escapeHtml(block.props.email)}">${escapeHtml(block.props.email)}</a></dd>
          </div>
          <div>
            <dt>Studio</dt>
            <dd>${escapeHtml(block.props.location)}</dd>
          </div>
        </dl>
      </div>
      <form class="${p}contact-form ${p}reveal" data-af-contact-form>
        <label class="${p}field">
          <span>Full Name</span>
          <input type="text" name="name" placeholder="Alex Morgan" required />
        </label>
        <label class="${p}field">
          <span>Work Email</span>
          <input type="email" name="email" placeholder="alex@company.com" required />
        </label>
        <label class="${p}field">
          <span>Project Brief</span>
          <textarea name="message" rows="4" placeholder="Share scope, timeline, and goals..." required></textarea>
        </label>
        <button type="submit" class="${p}btn ${p}btn-primary ${p}btn-full">${escapeHtml(block.props.submitLabel)}</button>
        <p class="${p}form-status" aria-live="polite"></p>
      </form>
    </div>
  </section>`;
    }

    case 'footer': {
      const colsHtml = block.props.columns
        .map(
          (col) => `      <div class="${p}footer-col ${p}reveal">
        <h3 class="${p}footer-heading">${escapeHtml(col.heading)}</h3>
        <ul>
          ${col.links
            .map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`)
            .join('\n          ')}
        </ul>
      </div>`
        )
        .join('\n');
      return `  <footer class="${p}footer ${bgCls} ${padCls}">
    <div class="${p}container ${p}footer-grid">
      <div class="${p}footer-brand ${p}reveal">
        <div class="${p}brand">${escapeHtml(block.props.brandName)}</div>
        <p class="${p}footer-summary">${escapeHtml(block.props.summary)}</p>
      </div>
${colsHtml}
    </div>
    <div class="${p}container ${p}footer-bottom">
      <p>${escapeHtml(block.props.copyright)}</p>
    </div>
  </footer>`;
    }
  }
}

export function generateCleanCss(theme: SiteTheme, options: ExportOptions): string {
  const p = (options.prefix || 'af-').replace(/[^a-zA-Z0-9_-]/g, '');
  const primary = safeCssColor(theme.primaryColor, '#1D4ED8');
  const accentText = safeCssColor(theme.accentTextColor, '#FFFFFF');
  const bg = safeCssColor(theme.backgroundColor, '#FFFFFF');
  const surface = safeCssColor(theme.surfaceColor, '#F4F6F8');
  const contrastBg = safeCssColor(theme.contrastBgColor, '#0F172A');
  const ink = safeCssColor(theme.textColor, '#000000');
  const muted = safeCssColor(theme.mutedTextColor, '#000000');
  const border = safeCssColor(theme.borderColor, '#E2E8F0');
  const displayFont = `"${safeFontName(theme.displayFont, 'Plus Jakarta Sans')}", system-ui, sans-serif`;
  const bodyFont = `"${safeFontName(theme.bodyFont, 'DM Sans')}", system-ui, sans-serif`;
  const radius = theme.radius;
  const rhythmMult = theme.spacing === 'compact' ? 0.78 : theme.spacing === 'airy' ? 1.25 : 1;
  const motionMode = theme.motion || 'editorial';

  const v = (varName: string, fallback: string) =>
    options.useCssVariables ? `var(${varName})` : fallback;

  const rawCss = `
${
  options.useCssVariables
    ? `:root {
  --${p}primary: ${primary};
  --${p}primary-ink: ${accentText};
  --${p}bg: ${bg};
  --${p}surface: ${surface};
  --${p}contrast: ${contrastBg};
  --${p}ink: ${ink};
  --${p}muted: ${muted};
  --${p}border: ${border};
  --${p}radius: ${radius};
  --${p}font-display: ${displayFont};
  --${p}font-body: ${bodyFont};
  --${p}container: 1200px;
}
`
    : ''
}
${
  options.includeReset
    ? `*, *::before, *::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  font-family: ${v(`--${p}font-body`, bodyFont)};
  color: ${v(`--${p}ink`, ink)};
  background-color: ${v(`--${p}bg`, bg)};
  line-height: 1.65;
  font-size: 17px;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
  text-decoration: none;
}
`
    : ''
}
.${p}container {
  width: 100%;
  max-width: ${options.useCssVariables ? `var(--${p}container)` : '1200px'};
  margin-inline: auto;
  padding-inline: 28px;
}

.${p}narrow {
  max-width: 820px;
}

.${p}bg-canvas {
  background-color: ${v(`--${p}bg`, bg)};
  color: ${v(`--${p}ink`, ink)};
}

.${p}bg-surface {
  background-color: ${v(`--${p}surface`, surface)};
  color: ${v(`--${p}ink`, ink)};
}

.${p}bg-contrast {
  background-color: ${v(`--${p}contrast`, contrastBg)};
  color: #FFFFFF;
}

.${p}bg-contrast .${p}section-intro,
.${p}bg-contrast .${p}hero-subtitle,
.${p}bg-contrast .${p}card-body,
.${p}bg-contrast .${p}eyebrow,
.${p}bg-contrast .${p}kicker,
.${p}bg-contrast .${p}stat-context,
.${p}bg-contrast .${p}pricing-audience,
.${p}bg-contrast .${p}pricing-cadence,
.${p}bg-contrast .${p}faq-answer,
.${p}bg-contrast .${p}footer-summary,
.${p}bg-contrast .${p}footer-bottom,
.${p}bg-contrast .${p}footer-col a {
  color: rgba(255, 255, 255, 0.88);
}

.${p}py-compact { padding-block: ${Math.round(38 * rhythmMult)}px; }
.${p}py-normal { padding-block: ${Math.round(80 * rhythmMult)}px; }
.${p}py-spacious { padding-block: ${Math.round(108 * rhythmMult)}px; }
.${p}mb-sm { margin-bottom: 16px; }
.${p}mt-md { margin-top: 28px; }

/* Navigation */
.${p}navbar {
  border-bottom: 1px solid ${v(`--${p}border`, border)};
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(12px);
}

.${p}bg-contrast.${p}navbar {
  border-bottom-color: rgba(255, 255, 255, 0.14);
}

.${p}navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  min-height: 74px;
}

.${p}brand {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  white-space: nowrap;
}

.${p}nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.${p}nav-link {
  position: relative;
  font-size: 0.96875rem;
  font-weight: 500;
  white-space: nowrap;
  padding-block: 4px;
  transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.${p}nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1.5px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.${p}nav-link:hover::after {
  transform: scaleX(1);
}

.${p}nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.${p}menu-toggle {
  display: none;
  background: transparent;
  border: 1px solid ${v(`--${p}border`, border)};
  color: inherit;
  border-radius: ${v(`--${p}radius`, radius)};
  padding: 8px 14px;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
}

/* Typography & Buttons */
.${p}kicker,
.${p}eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: ${v(`--${p}muted`, muted)};
}

.${p}kicker::before,
.${p}eyebrow::before {
  content: "";
  width: 22px;
  height: 1.5px;
  background-color: ${v(`--${p}primary`, primary)};
  flex-shrink: 0;
}

.${p}kicker-on-dark {
  color: rgba(255, 255, 255, 0.92);
}

.${p}hero-title {
  margin: 0 0 20px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(2.4rem, 4.3vw, 3.85rem);
  line-height: 1.06;
  letter-spacing: -0.03em;
  font-weight: 700;
  text-wrap: balance;
}

.${p}hero-subtitle {
  margin: 0 0 30px;
  font-size: 1.1875rem;
  line-height: 1.65;
  color: ${v(`--${p}muted`, muted)};
  max-width: 56ch;
}

.${p}section-head {
  max-width: 68ch;
  margin-bottom: 48px;
}

.${p}section-title {
  margin: 0 0 14px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(1.95rem, 3.1vw, 2.75rem);
  line-height: 1.13;
  letter-spacing: -0.025em;
  font-weight: 700;
  text-wrap: balance;
}

.${p}section-intro {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.65;
  color: ${v(`--${p}muted`, muted)};
}

.${p}btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.${p}btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 26px;
  border-radius: ${v(`--${p}radius`, radius)};
  font-family: ${v(`--${p}font-body`, bodyFont)};
  font-size: 0.96875rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease, background-color 150ms ease, border-color 150ms ease;
}

.${p}btn-sm {
  padding: 10px 20px;
  font-size: 0.9375rem;
}

.${p}btn:hover {
  transform: translateY(-1px);
}

.${p}btn:focus-visible {
  outline: 2px solid ${v(`--${p}primary`, primary)};
  outline-offset: 2px;
}

.${p}btn-primary {
  background-color: ${v(`--${p}primary`, primary)};
  color: ${v(`--${p}primary-ink`, accentText)};
}

.${p}btn-primary:hover {
  opacity: 0.93;
}

.${p}btn-secondary {
  background-color: transparent;
  color: inherit;
  border-color: ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}btn-secondary,
.${p}btn-secondary-on-dark {
  background-color: rgba(255, 255, 255, 0.08);
  color: #FFFFFF;
  border-color: rgba(255, 255, 255, 0.34);
}

.${p}btn-secondary:hover,
.${p}btn-secondary-on-dark:hover {
  opacity: 0.88;
}

.${p}btn-full {
  width: 100%;
}

/* Hero Layouts */
.${p}hero-split {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 52px;
  align-items: center;
}

.${p}hero-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.${p}hero-centered .${p}kicker {
  justify-content: center;
}

.${p}hero-centered .${p}hero-subtitle,
.${p}hero-centered .${p}btn-group {
  margin-inline: auto;
  justify-content: center;
}

.${p}hero-centered .${p}hero-media {
  margin-top: 48px;
  width: 100%;
  max-width: 1040px;
}

.${p}hero-banner {
  position: relative;
  border-radius: ${v(`--${p}radius`, radius)};
  overflow: hidden;
  min-height: 520px;
  display: flex;
  align-items: flex-end;
  padding: 56px;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.${p}hero-banner-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.${p}hero-banner-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, rgba(13, 15, 20, 0.92) 0%, rgba(13, 15, 20, 0.74) 54%, rgba(13, 15, 20, 0.35) 100%);
}

.${p}hero-banner-content {
  position: relative;
  z-index: 2;
  max-width: 680px;
  color: #FFFFFF;
}

.${p}hero-banner-content .${p}hero-subtitle {
  color: rgba(255, 255, 255, 0.9);
}

.${p}media-frame {
  border-radius: ${v(`--${p}radius`, radius)};
  overflow: hidden;
  border: 1px solid ${v(`--${p}border`, border)};
  box-shadow: 0 24px 48px -24px rgba(15, 23, 42, 0.22);
}

.${p}bg-contrast .${p}media-frame {
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: 0 28px 56px -24px rgba(0, 0, 0, 0.55);
}

.${p}media-img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

/* Stats */
.${p}stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid ${v(`--${p}border`, border)};
  border-bottom: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}stats-grid {
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}stat-item {
  padding: 28px 24px;
}

.${p}stat-item + .${p}stat-item {
  border-left: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}stat-item + .${p}stat-item {
  border-left-color: rgba(255, 255, 255, 0.16);
}

.${p}stat-item:first-child {
  padding-left: 0;
}

.${p}stat-value {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(2rem, 2.9vw, 2.65rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.${p}stat-label {
  margin-top: 8px;
  font-size: 1rem;
  font-weight: 600;
}

.${p}stat-context {
  margin-top: 4px;
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

/* Feature Grids */
.${p}grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.${p}grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
}

.${p}card {
  padding: 32px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease;
}

.${p}card:hover {
  transform: translateY(-2px);
}

.${p}bg-contrast .${p}card {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.${p}card-meta {
  margin: 0 0 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${v(`--${p}border`, border)};
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}card-meta {
  border-bottom-color: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.88);
}

.${p}card-title {
  margin: 0 0 10px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1.3125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.${p}card-body {
  margin: 0;
  font-size: 1rem;
  line-height: 1.65;
  color: ${v(`--${p}muted`, muted)};
}

/* Split Showcase */
.${p}split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 52px;
  align-items: center;
}

.${p}split-reverse .${p}split-media {
  order: -1;
}

.${p}check-list {
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
  color: ${v(`--${p}muted`, muted)};
}

.${p}check-list li {
  position: relative;
  padding-left: 26px;
  line-height: 1.55;
}

.${p}check-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 0;
  font-weight: 700;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}check-list li::before {
  color: #FFFFFF;
}

/* Pricing */
.${p}pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  align-items: stretch;
}

.${p}pricing-card {
  display: flex;
  flex-direction: column;
  padding: 34px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
}

.${p}bg-contrast .${p}pricing-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}pricing-featured {
  border-color: ${v(`--${p}primary`, primary)};
  border-top: 3px solid ${v(`--${p}primary`, primary)};
  box-shadow: 0 20px 44px -24px rgba(15, 23, 42, 0.22);
}

.${p}pricing-kicker {
  margin: 0 0 8px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${v(`--${p}primary`, primary)};
}

.${p}pricing-audience {
  margin: 4px 0 0;
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}pricing-price-row {
  margin: 22px 0 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.${p}pricing-amount {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 2.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
}

.${p}pricing-cadence {
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}pricing-divider {
  height: 1px;
  background-color: ${v(`--${p}border`, border)};
  margin: 22px 0;
}

.${p}bg-contrast .${p}pricing-divider {
  background-color: rgba(255, 255, 255, 0.15);
}

.${p}pricing-list {
  margin: 0 0 28px;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 11px;
  font-size: 0.96875rem;
  flex: 1;
}

.${p}pricing-list li {
  position: relative;
  padding-left: 24px;
}

.${p}pricing-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  font-weight: 700;
  color: ${v(`--${p}primary`, primary)};
}

/* Testimonial */
.${p}quote-wrap {
  max-width: 900px;
}

.${p}quote-mark {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 3.5rem;
  line-height: 0.8;
  margin-bottom: 12px;
  color: ${v(`--${p}primary`, primary)};
}

.${p}bg-contrast .${p}quote-mark {
  color: rgba(255, 255, 255, 0.5);
}

.${p}quote-text {
  margin: 0 0 28px;
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: clamp(1.65rem, 3vw, 2.35rem);
  line-height: 1.32;
  letter-spacing: -0.02em;
  font-weight: 500;
}

.${p}quote-footer {
  padding-top: 20px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.${p}bg-contrast .${p}quote-footer {
  border-top-color: rgba(255, 255, 255, 0.18);
}

.${p}quote-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 1rem;
}

.${p}quote-outcome {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
}

/* FAQ */
.${p}faq-list {
  border-top: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}faq-list,
.${p}bg-contrast .${p}faq-item {
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}faq-item {
  border-bottom: 1px solid ${v(`--${p}border`, border)};
  padding-block: 22px;
}

.${p}faq-question {
  font-family: ${v(`--${p}font-display`, displayFont)};
  font-size: 1.15rem;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.${p}faq-question::-webkit-details-marker {
  display: none;
}

.${p}faq-question::after {
  content: "+";
  font-size: 1.35rem;
  font-weight: 400;
  line-height: 1;
  flex-shrink: 0;
}

.${p}faq-item[open] .${p}faq-question::after {
  content: "−";
}

.${p}faq-answer {
  margin: 14px 0 0;
  font-size: 1rem;
  color: ${v(`--${p}muted`, muted)};
  line-height: 1.68;
  max-width: 66ch;
}

/* CTA Panel */
.${p}cta-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 48px;
  border-radius: ${v(`--${p}radius`, radius)};
  border: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}cta-panel {
  border-color: rgba(255, 255, 255, 0.16);
  background-color: rgba(255, 255, 255, 0.04);
}

.${p}cta-copy {
  max-width: 58ch;
}

/* Contact */
.${p}contact-split {
  align-items: start;
}

.${p}contact-details {
  margin: 30px 0 0;
  border-top: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast .${p}contact-details,
.${p}bg-contrast .${p}contact-details > div {
  border-color: rgba(255, 255, 255, 0.16);
}

.${p}contact-details > div {
  padding-block: 16px;
  border-bottom: 1px solid ${v(`--${p}border`, border)};
}

.${p}contact-details dt {
  font-size: 0.875rem;
  font-weight: 600;
  color: ${v(`--${p}muted`, muted)};
}

.${p}contact-details dd {
  margin: 4px 0 0;
  font-size: 1.0625rem;
  font-weight: 500;
}

.${p}contact-form {
  display: grid;
  gap: 18px;
  padding: 32px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}bg`, bg)};
  box-shadow: 0 20px 44px -26px rgba(15, 23, 42, 0.16);
}

.${p}bg-contrast .${p}contact-form {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.18);
}

.${p}field {
  display: grid;
  gap: 6px;
  font-size: 0.9375rem;
  font-weight: 500;
}

.${p}field input,
.${p}field textarea {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid ${v(`--${p}border`, border)};
  border-radius: ${v(`--${p}radius`, radius)};
  font: inherit;
  color: #000000;
  background: #FFFFFF;
}

.${p}field input:focus,
.${p}field textarea:focus {
  outline: 2px solid ${v(`--${p}primary`, primary)};
  outline-offset: 1px;
}

.${p}form-status {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${v(`--${p}primary`, primary)};
}

/* Footer */
.${p}footer {
  border-top: 1px solid ${v(`--${p}border`, border)};
}

.${p}bg-contrast.${p}footer {
  border-top-color: rgba(255, 255, 255, 0.14);
}

.${p}footer-grid {
  display: grid;
  grid-template-columns: 1.6fr repeat(2, 1fr);
  gap: 44px;
}

.${p}footer-summary {
  margin: 14px 0 0;
  max-width: 36ch;
  font-size: 1rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}footer-heading {
  margin: 0 0 14px;
  font-size: 0.9375rem;
  font-weight: 600;
}

.${p}footer-col ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
  font-size: 1rem;
}

.${p}footer-col a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.${p}footer-bottom {
  margin-top: 44px;
  padding-top: 24px;
  border-top: 1px solid ${v(`--${p}border`, border)};
  font-size: 0.9375rem;
  color: ${v(`--${p}muted`, muted)};
}

.${p}bg-contrast .${p}footer-bottom {
  border-top-color: rgba(255, 255, 255, 0.14);
}

/* Responsive Breakpoints */
@media (max-width: 900px) {
  .${p}hero-split,
  .${p}split,
  .${p}grid-3,
  .${p}stats-grid,
  .${p}footer-grid {
    grid-template-columns: 1fr;
  }

  .${p}stat-item {
    padding: 20px 0;
  }

  .${p}stat-item + .${p}stat-item {
    border-left: none;
    border-top: 1px solid ${v(`--${p}border`, border)};
  }

  .${p}bg-contrast .${p}stat-item + .${p}stat-item {
    border-top-color: rgba(255, 255, 255, 0.16);
  }

  .${p}split-reverse .${p}split-media {
    order: 0;
  }

  .${p}grid-2 {
    grid-template-columns: 1fr;
  }

  .${p}hero-banner {
    min-height: 420px;
    padding: 32px;
  }

  .${p}cta-panel {
    padding: 32px 24px;
  }
}

@media (max-width: 720px) {
  .${p}nav-links {
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 74px;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 28px;
    background: inherit;
    border-bottom: 1px solid ${v(`--${p}border`, border)};
    gap: 16px;
  }

  .${p}nav-links.${p}nav-open {
    display: flex;
  }

  .${p}menu-toggle {
    display: inline-flex;
  }
}

/* Marketing Announcement Bar */
.${p}promo-bar {
  background-color: ${v(`--${p}contrast`, contrastBg)};
  color: #FFFFFF;
  padding: 10px 24px;
  font-size: 0.9375rem;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
.${p}promo-inner {
  max-width: ${options.useCssVariables ? `var(--${p}container)` : '1200px'};
  margin-inline: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
.${p}promo-cta {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: ${v(`--${p}radius`, radius)};
  background-color: ${v(`--${p}primary`, primary)};
  color: ${v(`--${p}primary-ink`, accentText)};
  font-size: 0.875rem;
  font-weight: 600;
}

${
  motionMode !== 'none'
    ? `/* Motion & Micro-Interactions */
@keyframes ${p}fadeUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ${p}scaleIn {
  from {
    opacity: 0;
    transform: scale(0.975) translateY(14px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes ${p}bannerSettle {
  from {
    transform: scale(1.055);
  }
  to {
    transform: scale(1);
  }
}

@keyframes ${p}faqOpen {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.${p}navbar {
  transition: box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms ease;
}

.${p}navbar.${p}nav-scrolled {
  box-shadow: 0 12px 32px -22px rgba(15, 23, 42, 0.28);
}

.${p}btn:active {
  transform: translateY(0) scale(0.985);
}

.${p}media-frame .${p}media-img,
.${p}hero-banner .${p}hero-banner-bg {
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.${p}media-frame:hover .${p}media-img,
.${p}hero-banner:hover .${p}hero-banner-bg {
  transform: scale(1.03);
}

.${p}card {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease;
}

.${p}card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -26px rgba(15, 23, 42, 0.2);
}

.${p}pricing-card {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease;
}

.${p}pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 48px -24px rgba(15, 23, 42, 0.24);
}

.${p}faq-item[open] .${p}faq-answer {
  animation: ${p}faqOpen 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.${p}hero-copy > *,
.${p}hero-banner-content > * {
  animation: ${p}fadeUp ${motionMode === 'editorial' ? '640ms' : '420ms'} cubic-bezier(0.16, 1, 0.3, 1) both;
}

.${p}hero-copy > *:nth-child(1),
.${p}hero-banner-content > *:nth-child(1) {
  animation-delay: 40ms;
}

.${p}hero-copy > *:nth-child(2),
.${p}hero-banner-content > *:nth-child(2) {
  animation-delay: 110ms;
}

.${p}hero-copy > *:nth-child(3),
.${p}hero-banner-content > *:nth-child(3) {
  animation-delay: 175ms;
}

.${p}hero-copy > *:nth-child(4),
.${p}hero-banner-content > *:nth-child(4) {
  animation-delay: 240ms;
}

.${p}hero-media {
  animation: ${p}scaleIn ${motionMode === 'editorial' ? '720ms' : '460ms'} cubic-bezier(0.16, 1, 0.3, 1) 140ms both;
}
`
    : ''
}
${
  motionMode === 'editorial'
    ? `.${p}hero-banner-bg {
  animation: ${p}bannerSettle 1400ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

html.${p}motion-ready .${p}reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 620ms cubic-bezier(0.16, 1, 0.3, 1), transform 620ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

html.${p}motion-ready .${p}reveal.${p}in-view {
  opacity: 1;
  transform: translateY(0);
}

html.${p}motion-ready .${p}reveal:nth-child(2) { transition-delay: 70ms; }
html.${p}motion-ready .${p}reveal:nth-child(3) { transition-delay: 140ms; }
html.${p}motion-ready .${p}reveal:nth-child(4) { transition-delay: 210ms; }
html.${p}motion-ready .${p}reveal:nth-child(5) { transition-delay: 280ms; }
html.${p}motion-ready .${p}reveal:nth-child(6) { transition-delay: 350ms; }
`
    : ''
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  html.${p}motion-ready .${p}reveal {
    opacity: 1 !important;
    transform: none !important;
  }
}
`.trim();

  if (!options.minify) {
    return rawCss;
  }

  return rawCss
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

export function generateCleanHtml(
  project: SiteProject,
  options: ExportOptions,
  inlineCss = false
): string {
  const p = (options.prefix || 'af-').replace(/[^a-zA-Z0-9_-]/g, '');
  const fontsHref = getGoogleFontsUrl(project.theme);
  const bodyBlocks = project.blocks.map((block) => renderBlockHtml(block, p)).join('\n\n');
  const css = inlineCss ? generateCleanCss(project.theme, options) : '';

  const seoTitle = project.seo?.title?.trim() || project.name;
  const seoDesc = project.seo?.description?.trim() || project.description || project.name;
  const seoLang = (project.seo?.language || 'en').replace(/[^a-zA-Z-]/g, '') || 'en';
  const rawCanonical =
    project.seo?.canonicalUrl?.trim() ||
    project.seo?.customDomain?.trim() ||
    '';
  const canonicalHref =
    rawCanonical &&
    !/^https?:\/\//i.test(rawCanonical) &&
    !rawCanonical.startsWith('/')
      ? `https://${rawCanonical}`
      : rawCanonical;
  const formEndpoint = options.formEndpoint?.trim() || '';
  const trackEndpoint = options.trackEndpoint?.trim() || '';

  const mkt = project.marketing;
  const ga4Id =
    mkt?.ga4MeasurementId && /^G-[A-Z0-9]{4,18}$/i.test(mkt.ga4MeasurementId.trim())
      ? mkt.ga4MeasurementId.trim().toUpperCase()
      : '';
  const adsId =
    mkt?.googleAdsId && /^AW-[A-Z0-9]{4,18}$/i.test(mkt.googleAdsId.trim())
      ? mkt.googleAdsId.trim().toUpperCase()
      : '';
  const metaPixelId =
    mkt?.metaPixelId && /^\d{8,22}$/.test(mkt.metaPixelId.trim())
      ? mkt.metaPixelId.trim()
      : '';
  const linkedinId =
    mkt?.linkedinPartnerId && /^\d{4,16}$/.test(mkt.linkedinPartnerId.trim())
      ? mkt.linkedinPartnerId.trim()
      : '';

  const gtagPrimaryId = ga4Id || adsId;
  const gtagSnippet = gtagPrimaryId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(
        gtagPrimaryId
      )}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());${
      ga4Id ? `\n    gtag('config', ${JSON.stringify(ga4Id)});` : ''
    }${adsId ? `\n    gtag('config', ${JSON.stringify(adsId)});` : ''}
  </script>`
    : '';

  const metaPixelSnippet = metaPixelId
    ? `<script>
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', ${JSON.stringify(metaPixelId)});
    fbq('track', 'PageView');
  </script>`
    : '';

  const linkedinSnippet = linkedinId
    ? `<script>
    _linkedin_partner_id = ${JSON.stringify(linkedinId)};
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(_linkedin_partner_id);
    (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};
    window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];
    var b=document.createElement("script");b.type="text/javascript";b.async=true;
    b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b,s);})(window.lintrk);
  </script>`
    : '';

  const jsonLdSnippet = mkt?.enableJsonLd
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: seoTitle,
        description: seoDesc,
        ...(canonicalHref ? { url: canonicalHref } : {}),
      }).replace(/</g, '\\u003c')}</script>`
    : '';

  const promoBarHtml =
    mkt?.announcementEnabled && mkt.announcementText?.trim()
      ? `  <div class="${p}promo-bar" role="region" aria-label="Promotional announcement">
    <div class="${p}promo-inner">
      <span>${escapeHtml(mkt.announcementText.trim())}</span>${
        mkt.announcementCtaLabel?.trim()
          ? `
      <a href="${escapeHtml(
        mkt.announcementCtaHref?.trim() || '#contact'
      )}" class="${p}promo-cta">${escapeHtml(mkt.announcementCtaLabel.trim())}</a>`
          : ''
      }
    </div>
  </div>\n`
      : '';

  const motionMode = project.theme.motion || 'editorial';
  const interactionScript = `<script>
    (function () {
      var motionMode = ${JSON.stringify(motionMode)};
      var navbar = document.querySelector('.${p}navbar');
      if (navbar && motionMode !== 'none') {
        var onNavScroll = function () {
          navbar.classList.toggle('${p}nav-scrolled', window.scrollY > 12);
        };
        window.addEventListener('scroll', onNavScroll, { passive: true });
        onNavScroll();
      }
      var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (motionMode === 'editorial' && !reducedMotion) {
        var revealEls = Array.prototype.slice.call(document.querySelectorAll('.${p}reveal'));
        if (revealEls.length > 0) {
          document.documentElement.classList.add('${p}motion-ready');
          var revealIfVisible = function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.96) {
              el.classList.add('${p}in-view');
              return true;
            }
            return false;
          };
          revealEls.forEach(function (el) { revealIfVisible(el); });
          if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add('${p}in-view');
                  io.unobserve(entry.target);
                }
              });
            }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
            revealEls.forEach(function (el) {
              if (!el.classList.contains('${p}in-view')) io.observe(el);
            });
          } else {
            revealEls.forEach(function (el) { el.classList.add('${p}in-view'); });
          }
          setTimeout(function () {
            revealEls.forEach(function (el) {
              if (!el.classList.contains('${p}in-view')) {
                var rect = el.getBoundingClientRect();
                if (rect.top <= (window.innerHeight || 900) * 1.15) {
                  el.classList.add('${p}in-view');
                }
              }
            });
          }, 900);
        }
      }
      var toggle = document.querySelector('.${p}menu-toggle');
      var nav = document.querySelector('.${p}nav-links');
      if (toggle && nav) {
        toggle.addEventListener('click', function () {
          var open = nav.classList.toggle('${p}nav-open');
          toggle.setAttribute('aria-expanded', String(open));
        });
      }
      var trackUrl = ${JSON.stringify(trackEndpoint)};
      if (trackUrl) {
        document.querySelectorAll('.${p}btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var label = (btn.textContent || '').trim().slice(0, 80);
            var payload = JSON.stringify({ eventType: 'cta_click', targetLabel: label });
            if (navigator.sendBeacon) {
              navigator.sendBeacon(trackUrl, new Blob([payload], { type: 'application/json' }));
            } else {
              fetch(trackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function () {});
            }
          });
        });
      }
      var forms = document.querySelectorAll('[data-af-contact-form]');
      var endpoint = ${JSON.stringify(formEndpoint)};
      forms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var statusEl = form.querySelector('.${p}form-status');
          var submitBtn = form.querySelector('button[type="submit"]');
          var nameVal = (form.querySelector('[name="name"]') || {}).value || '';
          var emailVal = (form.querySelector('[name="email"]') || {}).value || '';
          var msgVal = (form.querySelector('[name="message"]') || {}).value || '';
          if (!endpoint) {
            if (statusEl) statusEl.textContent = 'Thank you — your brief has been recorded.';
            form.reset();
            return;
          }
          if (submitBtn) submitBtn.disabled = true;
          if (statusEl) statusEl.textContent = 'Sending...';
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameVal, email: emailVal, message: msgVal })
          })
            .then(function (res) {
              if (!res.ok) throw new Error('Submission failed');
              return res.json();
            })
            .then(function () {
              if (statusEl) statusEl.textContent = 'Thank you — your inquiry was received.';
              form.reset();
            })
            .catch(function () {
              if (statusEl) statusEl.textContent = 'Unable to send right now. Please try again.';
            })
            .finally(function () {
              if (submitBtn) submitBtn.disabled = false;
            });
        });
      });
    })();
  </script>`;

  const doc = `<!doctype html>
<html lang="${escapeHtml(seoLang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDesc)}" />
  <meta property="og:title" content="${escapeHtml(seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(seoDesc)}" />
  <meta property="og:type" content="website" />
  ${canonicalHref ? `<meta property="og:url" content="${escapeHtml(canonicalHref)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  ${canonicalHref ? `<link rel="canonical" href="${escapeHtml(canonicalHref)}" />` : ''}
  ${jsonLdSnippet}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${fontsHref}" rel="stylesheet" />
  ${
    inlineCss
      ? `<style>\n${css}\n  </style>`
      : `<link rel="stylesheet" href="./styles.css" />`
  }
  ${gtagSnippet}
  ${metaPixelSnippet}
  ${linkedinSnippet}
</head>
<body>
${promoBarHtml}${bodyBlocks}
  ${interactionScript}
</body>
</html>`;

  if (!options.minify || inlineCss) {
    return doc;
  }
  return doc.replace(/>\s+</g, '><').trim();
}
