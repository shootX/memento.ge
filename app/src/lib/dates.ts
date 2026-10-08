const monthsKa = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი',
];

export function formatGeorgianDate(iso: string, locale: 'ka' | 'en' | 'ru' = 'ka'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (locale === 'en') {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  if (locale === 'ru') {
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return `${d.getDate()} ${monthsKa[d.getMonth()]}, ${d.getFullYear()}`;
}
