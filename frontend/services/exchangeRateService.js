// services/exchangeRateService.js - Update the fetchExchangeRates function

// Cache exchange rates to reduce API calls
let cachedRates = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

/**
 * Fetch current exchange rates from the backend API
 * @returns {Promise<Object>} Exchange rates with USD as base
 */
export const fetchExchangeRates = async () => {
  // Check if we have a valid cached value
  const now = Date.now();
  if (cachedRates && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    return cachedRates;
  }

  try {
    // Call your backend API endpoint instead of the external API
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${API_URL}/exchange-rates/`);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.rates) {
      // Update cache
      cachedRates = data.rates;
      cacheTimestamp = now;
      return data.rates;
    } else {
      throw new Error('Failed to fetch exchange rates: Invalid response format');
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // If we have stale cached data, return it as fallback
    if (cachedRates) {
      return cachedRates;
    }
    
    // No cached data, return fallback hardcoded rates
    return {
      COP: 4000, // Approximate USD to COP rate
      EUR: 0.92,
      GBP: 0.78,
      JPY: 110.0,
      CAD: 1.35,
      AUD: 1.45,
    };
  }
};