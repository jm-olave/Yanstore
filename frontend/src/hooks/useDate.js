import { useCallback } from 'react';

/**
 * Custom hook providing date utility functions
 * @returns {Object} Date utility functions
 */
const useDate = () => {
  /**
   * Formats a date string for the API
   * @param {string} dateString - Date in any valid format
   * @returns {string} Formatted date string for the API
   */
  const formatForApi = useCallback((dateString) => {
    try {
      if (!dateString) return null;
      
      // Parse the date string
      const date = new Date(dateString);
      
      // Check if it's a valid date
      if (isNaN(date.getTime())) {
        console.error('Invalid date input:', dateString);
        return null;
      }
      
      // Format as YYYY-MM-DDT00:00:00Z (ISO format with T separator)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}T00:00:00Z`;
    } catch (error) {
      console.error('Error formatting date for API:', error);
      return null;
    }
  }, []);
  
  /**
   * Formats a date from the API for display in forms
   * @param {string} apiDateString - Date string from the API
   * @returns {string} Formatted date for HTML date input (YYYY-MM-DD)
   */
  const formatForDisplay = useCallback((apiDateString) => {
    try {
      if (!apiDateString) return '';
      
      // Parse the date
      const date = new Date(apiDateString);
      
      // Check if it's a valid date
      if (isNaN(date.getTime())) {
        console.error('Invalid API date:', apiDateString);
        return '';
      }
      
      // Format as YYYY-MM-DD for HTML date inputs
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return '';
    }
  }, []);
  
  /**
   * Checks if a date string is valid
   * @param {string} dateString - Date string to validate
   * @returns {boolean} Whether the date is valid
   */
  const isValidDate = useCallback((dateString) => {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }, []);
  
  /**
   * Gets the current date in YYYY-MM-DD format
   * @returns {string} Current date formatted for HTML date input
   */
  const getCurrentDate = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }, []);
  
  /**
   * Formats a date for display to users (e.g., "March 15, 2023")
   * @param {string} dateString - Date in any valid format
   * @returns {string} Human-readable date
   */
  const formatForHuman = useCallback((dateString) => {
    try {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return '';
      
      // Format as "Month Day, Year"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date for human:', error);
      return '';
    }
  }, []);
  
  return {
    formatForApi,
    formatForDisplay,
    isValidDate,
    getCurrentDate,
    formatForHuman
  };
};

export default useDate;