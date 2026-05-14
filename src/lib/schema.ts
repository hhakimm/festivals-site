import type { Item } from './data';
import { AREA_CODE, formatDate } from './data';

// YYYYMMDD → ISO 8601 (YYYY-MM-DD)
function isoDate(yyyymmdd: string | null): string | undefined {
  if (!yyyymmdd || yyyymmdd.length !== 8) return undefined;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export function buildEventSchema(item: Item, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Festival',
    name: item.title,
    description: `${item.title} - ${item.address}`,
    startDate: isoDate(item.startDate),
    endDate: isoDate(item.endDate),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: item.address || AREA_CODE[item.areacode]?.ko || 'Korea',
      address: {
        '@type': 'PostalAddress',
        streetAddress: item.address,
        addressCountry: 'KR',
        addressRegion: AREA_CODE[item.areacode]?.en || 'Korea',
      },
      ...(item.lat && item.lng
        ? { geo: { '@type': 'GeoCoordinates', latitude: item.lat, longitude: item.lng } }
        : {}),
    },
    ...(item.image ? { image: item.image } : {}),
    url,
    organizer: { '@type': 'Organization', name: '한국관광공사', url: 'https://api.visitkorea.or.kr/' },
  };
}

export function buildAttractionSchema(item: Item, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: item.title,
    description: `${item.title} - ${item.address}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: item.address,
      addressCountry: 'KR',
      addressRegion: AREA_CODE[item.areacode]?.en || 'Korea',
    },
    ...(item.lat && item.lng
      ? { geo: { '@type': 'GeoCoordinates', latitude: item.lat, longitude: item.lng } }
      : {}),
    ...(item.image ? { image: item.image } : {}),
    url,
    ...(item.tel ? { telephone: item.tel } : {}),
  };
}

export function buildBreadcrumb(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
