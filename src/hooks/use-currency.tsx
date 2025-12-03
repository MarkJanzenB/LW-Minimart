import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Exchange rates relative to USD (base currency)
export const exchangeRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  PHP: 56.25,
  SGD: 1.34,
  MYR: 4.47,
  THB: 34.50,
  IDR: 15750,
  VND: 24500,
  INR: 83.25,
  CNY: 7.24,
  AUD: 1.52,
  CAD: 1.36,
};

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: exchangeRates.USD },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: exchangeRates.EUR },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: exchangeRates.GBP },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: exchangeRates.JPY },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: exchangeRates.PHP },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: exchangeRates.SGD },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: exchangeRates.MYR },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: exchangeRates.THB },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: exchangeRates.IDR },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: exchangeRates.VND },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: exchangeRates.INR },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: exchangeRates.CNY },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: exchangeRates.AUD },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: exchangeRates.CAD },
];

interface CurrencyStore {
  currency: typeof currencies[0];
  setCurrency: (code: string) => void;
}

export const useCurrency = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: currencies[0],
      setCurrency: (code: string) => {
        const currency = currencies.find((c) => c.code === code);
        if (currency) {
          set({ currency });
        }
      },
    }),
    {
      name: 'currency-storage',
    }
  )
);

// Convert amount from USD (base) to target currency
export const convertCurrency = (amountInUSD: number, targetCurrencyCode: string): number => {
  const rate = exchangeRates[targetCurrencyCode] || 1;
  return amountInUSD * rate;
};

// Format currency with conversion from USD base
export const formatCurrency = (amountInUSD: number, currencyCode?: string) => {
  const store = useCurrency.getState();
  const currency = currencyCode 
    ? currencies.find(c => c.code === currencyCode) || store.currency
    : store.currency;
  
  // Convert from USD to target currency
  const convertedAmount = convertCurrency(amountInUSD, currency.code);
  
  // Determine decimal places based on currency
  const decimals = ['JPY', 'IDR', 'VND'].includes(currency.code) ? 0 : 2;
  
  return `${currency.symbol}${convertedAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};
