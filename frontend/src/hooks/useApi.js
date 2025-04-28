import { useState, useEffect, useCallback } from 'react';

// Get API URL from environment with fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://new-yanstore-api-c29287e7c68d.herokuapp.com';

/**
 * Custom hook for making API calls
 * @returns {Object} API methods and state
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Make a fetch request to the API
   * @param {string} endpoint - API endpoint (starting with /)
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   */
  const fetchData = useCallback(async (endpoint, options = {}) => {
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
    const url = `${baseUrl}${normalizedEndpoint}`;
    console.log(`API Request URL: ${url}`);
    console.log(`API Request Method: ${options.method || 'GET'}`);
    
    try {
      setLoading(true);
      setError(null);
      
      // Don't set any default headers if we're sending FormData
      const isFormData = options.body instanceof FormData;
      const headers = isFormData 
        ? undefined // Let the browser set the correct Content-Type with boundary
        : {
            'Accept': 'application/json',
            ...(options.headers || {})
          };
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        
        try {
          // Try to parse as JSON for detailed error
          const errorJson = JSON.parse(errorText);
          
          // Handle different error formats
          if (errorJson.detail) {
            if (typeof errorJson.detail === 'string') {
              errorDetail = errorJson.detail;
            } else if (Array.isArray(errorJson.detail)) {
              errorDetail = errorJson.detail.map(err => 
                typeof err === 'object' ? (err.msg || JSON.stringify(err)) : err
              ).join('; ');
            } else if (typeof errorJson.detail === 'object') {
              errorDetail = JSON.stringify(errorJson.detail);
            } else {
              errorDetail = `Error ${response.status}: Validation failed`;
            }
          } else {
            errorDetail = `Error ${response.status}: ${JSON.stringify(errorJson)}`;
          }
        } catch {
          // If not JSON, use text
          errorDetail = errorText || `Error ${response.status}`;
        }
        
        console.log('API Error Detail:', errorDetail);
        throw new Error(errorDetail);
      }
      
      const data = await response.json();
      console.log('API Response Data:', data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all products
   * @returns {Promise<Array>} Products array
   */
  const getProducts = useCallback(async () => {
    try {
      let allProducts = [];
      let page = 1;
      const pageSize = 1000; // Increased page size to reduce API calls
      let hasMore = true;

      while (hasMore) {
        const response = await fetchData(`/products/?skip=${(page - 1) * pageSize}&limit=${pageSize}`);
        console.log(`Fetching page ${page} of products`);
        console.log('API Response:', response);
        
        if (Array.isArray(response)) {
          allProducts = [...allProducts, ...response];
          // If we got fewer products than the page size, we've reached the end
          hasMore = response.length === pageSize;
          page++;
        } else {
          console.error('Unexpected API response format:', response);
          break;
        }

        console.log(`Current total products: ${allProducts.length}`);
      }

      console.log('Total products fetched:', allProducts.length);
      return allProducts;
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw error;
    }
  }, [fetchData]);

  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Promise<Object>} Product data
   */
  const getProduct = useCallback((id) => {
    return fetchData(`/products/${id}`);
  }, [fetchData]);

  /**
   * Get all categories
   * @returns {Promise<Array>} Categories array
   */
  const getCategories = useCallback(() => {
    return fetchData('/categories/');
  }, [fetchData]);

  /**
   * Create a product
   * @param {FormData} formData - Product form data
   * @returns {Promise<Object>} Created product
   */
  const createProduct = useCallback((formData) => {
    return fetchData('/products/', {
      method: 'POST',
      body: formData
      // Don't set Content-Type header when using FormData
    });
  }, [fetchData]);

  /**
   * Update a product
   * @param {number} id - Product ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated product
   */
  const updateProduct = useCallback((id, data) => {
    return fetchData(`/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }, [fetchData]);

  /**
   * Delete a product
   * @param {number} id - Product ID
   * @returns {Promise<Object>} Response data
   */
  const deleteProduct = useCallback((id) => {
    return fetchData(`/products/${id}`, {
      method: 'DELETE'
    });
  }, [fetchData]);

  /**
   * Register a sale
   * @param {Object} saleData - Sale data
   * @returns {Promise<Object>} Sale response
   */
  const registerSale = useCallback((saleData) => {
    return fetchData('/sales/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(saleData)
    });
  }, [fetchData]);

  /**
   * Create a price point for a product
   * @param {Object} priceData - Price point data
   * @returns {Promise<Object>} Price point response
   */
  const createPricePoint = useCallback((priceData) => {
    return fetchData('/price-points/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(priceData)
    });
  }, [fetchData]);

  /**
   * Create a category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Category response
   */
  const createCategory = useCallback((categoryData) => {
    return fetchData('/categories/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    });
  }, [fetchData]);

  /**
   * Delete a category
   * @param {number} id - category ID
   * @returns {Promise<Object>} Response data
   */
  const deleteCategory = useCallback((id) => {
    return fetchData(`/categories/${id}`, {
      method: 'DELETE'
    });
  }, [fetchData]);

  /**
   * Delete a supplier
   * @param {number} id - supplier ID
   * @returns {Promise<Object>} Response data
   */
  const deleteSupplier = useCallback((id) => {
    return fetchData(`/suppliers/${id}`, {
      method: 'DELETE'
    });
  }, [fetchData]);

  /**
   * Add a Supplier
   * @param {object} SupplierData - category ID
   * @returns {Promise<Object>} Response data
   */
  const createSupplier = useCallback((SupplierData) => {
    return fetchData('/suppliers/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(SupplierData)
    });
  }, [fetchData]);

  /**
   * Get all suppliers
   * @returns {Promise<Array>} Suppliers array
   */
  const getSuppliers = useCallback(() => {
    return fetchData('/suppliers/');
  }, [fetchData]);

  /**
   * Update a supplier
   * @param {number} id - Product ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated product
   */
  const updateSupplier = useCallback((id, data) => {
    return fetchData(`/suppliers/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }, [fetchData]);

  return {
    loading,
    error,
    fetchData,
    getProducts,
    getProduct,
    getCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    registerSale,
    createPricePoint,
    createCategory,
    deleteCategory,
    createSupplier,
    getSuppliers,
    deleteSupplier,
    updateSupplier
  };
};

export default useApi;
