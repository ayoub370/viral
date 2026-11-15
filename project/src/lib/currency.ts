const countryToCurrency: Record<string, string> = {
  'France': 'EUR',
  'Belgique': 'EUR',
  'Suisse': 'CHF',
  'Canada': 'CAD',
  'Maroc': 'MAD',
  'Algérie': 'DZD',
  'Tunisie': 'TND',
  'Sénégal': 'XOF',
  "Côte d'Ivoire": 'XOF',
  'Royaume-Uni': 'GBP',
  'États-Unis': 'USD',
  'Allemagne': 'EUR',
  'Espagne': 'EUR',
  'Italie': 'EUR',
  'Portugal': 'EUR',
  'Pays-Bas': 'EUR',
  'Brésil': 'BRL',
  'Mexique': 'MXN',
  'Cameroun': 'XAF',
  'Guinée': 'GNF',
  'Mali': 'XOF',
  'Burkina Faso': 'XOF',
  'Niger': 'XOF',
  'Congo (RDC)': 'CDF',
  'Congo-Brazzaville': 'XAF',
  'Gabon': 'XAF',
  'Russie': 'RUB',
  'Chine': 'CNY',
  'Japon': 'JPY',
  'Inde': 'INR',
  'Australie': 'AUD',
  'Afrique du Sud': 'ZAR',
  'Nigeria': 'NGN',
  'Ghana': 'GHS',
  'Turquie': 'TRY',
  'Arabie Saoudite': 'SAR',
  'Émirats Arabes Unis': 'AED',
  'Égypte': 'EGP',
  'Liban': 'LBP',
  'Argentine': 'ARS',
};

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  MXN: '$',
  RUB: '₽',
  ZAR: 'R',
  NGN: '₦',
  GHS: '₵',
  TRY: '₺',
  SAR: '﷼',
  AED: 'د.إ',
  EGP: '£',
  LBP: '£',
  ARS: '$',
  MAD: 'DH',
  DZD: 'DA',
  TND: 'DT',
  XOF: 'FCFA',
  XAF: 'FCFA',
  CDF: 'FC',
  GNF: 'GNF',
};

export function getCurrencyForCountry(country: string | null | undefined): string {
  if (!country) return 'EUR';
  return countryToCurrency[country] || 'EUR';
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}

export function formatBalance(amount: number, country: string | null | undefined): string {
  const currency = getCurrencyForCountry(country);
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
