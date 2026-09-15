function buildEmbedUrl(query) {
  const value = String(query || '').trim()

  if (!value) {
    return ''
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(
    value,
  )}&output=embed`
}

export function getGoogleMapsEmbedUrl(
  value,
  fallbackAddress = '',
) {
  const raw = String(value || '').trim()

  if (!raw) {
    return buildEmbedUrl(fallbackAddress)
  }

  // Only allow Google-hosted embed URLs to preserve the iframe trust boundary.
  if (/\/maps\/embed(?:\?|\/)/i.test(raw)) {
    try {
      const url = new URL(raw)
      const hostname = url.hostname.toLowerCase()
      if (hostname === 'www.google.com' || hostname === 'maps.google.com') {
        return url.href
      }
    } catch {
      return buildEmbedUrl(fallbackAddress)
    }
    return buildEmbedUrl(fallbackAddress)
  }

  try {
    const url = new URL(raw)

    const decodedPath = decodeURIComponent(
      url.pathname.replace(/\+/g, ' '),
    )

    const decodedSearch = decodeURIComponent(
      url.search.replace(/\+/g, ' '),
    )

    const completeValue = `${decodedPath}${decodedSearch}`

    const coordinateMatch = completeValue.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    )

    if (coordinateMatch) {
      return buildEmbedUrl(
        `${coordinateMatch[1]},${coordinateMatch[2]}`,
      )
    }

    const query =
      url.searchParams.get('q') ||
      url.searchParams.get('query') ||
      url.searchParams.get('destination') ||
      url.searchParams.get('ll')

    if (query) {
      return buildEmbedUrl(query)
    }

    const placeMatch = decodedPath.match(
      /\/maps\/place\/([^/]+)/i,
    )

    if (placeMatch?.[1]) {
      return buildEmbedUrl(placeMatch[1])
    }

    /*
     * Link pendek maps.app.goo.gl tidak memuat alamat atau
     * koordinat sebelum redirect. Untuk iframe, gunakan alamat
     * sekretariat sebagai fallback.
     *
     * Link pendek aslinya tetap bisa digunakan untuk tombol
     * "Buka Google Maps".
     */
    if (/maps\.app\.goo\.gl$/i.test(url.hostname)) {
      return buildEmbedUrl(fallbackAddress)
    }
  } catch {
    return buildEmbedUrl(raw || fallbackAddress)
  }

  return buildEmbedUrl(fallbackAddress || raw)
}