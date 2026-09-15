'use client'

import { Link } from '@/lib/react-router-dom-shim'

const previewClasses = {
  desktop: {
    section: 'hero-preview-desktop pt-36 pb-28',
    container: 'px-10',
  },
  tablet: {
    section: 'hero-preview-tablet pt-28 pb-24',
    container: 'px-8',
  },
  mobile: {
    section: 'hero-preview-mobile pt-20 pb-16',
    container: 'px-5',
  },
}

export default function HeroSection({
  config = {},
  heroImage = '',
  interactive = true,
  previewMode = null,
}) {
  const preview = previewMode ? previewClasses[previewMode] : null

  function preventPreviewNavigation(event) {
    if (!interactive) event.preventDefault()
  }

  return (
    <section
      id={interactive ? 'beranda' : undefined}
      data-preview-mode={previewMode || undefined}
      className={`relative overflow-hidden bg-cover bg-center ${
        preview?.section ||
        'pt-28 pb-20 sm:pt-36 sm:pb-28 md:pt-48 md:pb-40'
      }`}
      style={{
        backgroundImage: heroImage ? `url(${heroImage})` : 'none',
        backgroundColor: '#f0fdf4',
      }}
    >
      <div className="hero-overlay absolute inset-0" />
      <div className="hero-grid-pattern absolute inset-0" />

      <div
        className={`relative z-10 mx-auto max-w-7xl ${
          preview?.container || 'px-4 sm:px-6 lg:px-8'
        }`}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span
            className="eyebrow justify-center animate-fade-in-up"
            style={{ animationDelay: '50ms' }}
          >
            {config.hero_eyebrow}
          </span>

          <h1
            className="hero-title animate-fade-in-up text-center"
            style={{ animationDelay: '100ms' }}
          >
            {config.hero_title}
            <br />
            <em>{config.hero_emphasis}</em>
          </h1>

          <p
            className="lede mx-auto animate-fade-in-up text-center"
            style={{ animationDelay: '200ms' }}
          >
            {config.hero_description}
          </p>

          <div
            className="hero-actions justify-center animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <a
              href="#kegiatan"
              className="original-btn original-btn-primary"
              onClick={preventPreviewNavigation}
              tabIndex={interactive ? undefined : -1}
            >
              {config.hero_primary_label}
            </a>

            <Link
              to="/struktur"
              className="original-btn original-btn-ghost"
              onClick={preventPreviewNavigation}
              tabIndex={interactive ? undefined : -1}
            >
              {config.hero_secondary_label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
