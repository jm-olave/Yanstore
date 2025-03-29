import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to fetch and manage currency exchange rates
 * @returns {Object} Exchange rate state and utilities
 */
const useExchangeRate = () => {
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch exchange rates on component mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call your backend API endpoint
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/exchange-rates/`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.rates) {
          setExchangeRates(data.rates);
        } else {
          // Fallback if the response format is unexpected
          setExchangeRates({ COP: 4000 });
        }
      } catch (err) {
        console.error('Error in useExchangeRate hook:', err);
        setError(err.message);
        // Fallback to a reasonable approximate value if API fails
        setExchangeRates({ COP: 4000 }); 
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  /**
   * Convert a USD amount to COP
   * @param {number} usdAmount - Amount in USD
   * @returns {string} Formatted amount in COP
   */
  const convertToCOP = useCallback((usdAmount) => {
    if (!usdAmount || isNaN(usdAmount) || !exchangeRates?.COP) {
      return '0 COP';
    }
    
    const copAmount = parseFloat(usdAmount) * exchangeRates.COP;
    return `${copAmount.toLocaleString('es-CO')} COP`;
  }, [exchangeRates]);

  return {
    exchangeRates,
    loading,
    error,
    convertToCOP
  };
};

export default useExchangeRate;