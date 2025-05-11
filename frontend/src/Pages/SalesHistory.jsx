import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TableRow from '../Components/TableRow/TableRow';
import TableCol from '../Components/TableCol/TableCol';
import InputSelect from '../Components/SelectInput/InputSelect';
import useApi from '../hooks/useApi';
import Caret from '../Components/Caret/Caret';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ITEMS_PER_PAGE = 100;

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    payment_method: '',
    start_date: '',
    end_date: '',
    product_id: ''
  });
  const [rentabilityData, setRentabilityData] = useState([]);
  const [rentabilityLoading, setRentabilityLoading] = useState(true);

  const tableHeaders = [
    'SALE ID',
    'PRODUCT',
    'SALE PRICE',
    'PAYMENT METHOD',
    'SALE DATE',
    'NOTES',
    'ACTIONS'
  ];

  const paymentMethods = [
    { value: '', label: 'All Payment Methods' },
    { value: 'Credit', label: 'Credit' },
    { value: 'Cash', label: 'Cash' },
    { value: 'USD', label: 'USD' },
    { value: 'Trade', label: 'Trade' }
  ];

  // Fetch sales data
  const fetchSales = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('skip', (currentPage - 1) * ITEMS_PER_PAGE);
      queryParams.append('limit', ITEMS_PER_PAGE);
      
      if (filters.payment_method) {
        queryParams.append('payment_method', filters.payment_method);
      }
      
      if (filters.start_date) {
        queryParams.append('start_date', filters.start_date);
      }
      
      if (filters.end_date) {
        queryParams.append('end_date', filters.end_date);
      }
      
      if (filters.product_id) {
        queryParams.append('product_id', filters.product_id);
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sales/?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }
      
      const data = await response.json();
      setSales(data);
      
      // For pagination, we would ideally get a total count from the API
      // For now, we'll estimate based on whether we got a full page
      if (data.length < ITEMS_PER_PAGE) {
        setTotalPages(currentPage);
      } else {
        setTotalPages(currentPage + 1);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // New function to fetch rentability data
  const fetchRentabilityData = async () => {
    setRentabilityLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products-with-rentability/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rentability data');
      }
      
      const data = await response.json();
      
      // Filter products that have sales (sales_count > 0)
      const productsWithSales = data.filter(product => product.sales_count > 0);
      
      setRentabilityData(productsWithSales);
    } catch (error) {
      console.error('Error fetching rentability data:', error);
    } finally {
      setRentabilityLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    // Sort products by total_profit in descending order
    const sortedProducts = [...rentabilityData].sort((a, b) => b.total_profit - a.total_profit);
    
    // Take top 10 products for better visualization
    const topProducts = sortedProducts.slice(0, 10);
    
    // Generate random colors for chart segments
    const generateColors = (count) => {
      const colors = [];
      for (let i = 0; i < count; i++) {
        const hue = (i * 137) % 360; // Use golden ratio to spread colors
        colors.push(`hsl(${hue}, 70%, 60%)`);
      }
      return colors;
    };
    
    const backgroundColors = generateColors(topProducts.length);
    
    return {
      labels: topProducts.map(product => product.name || `Product #${product.product_id}`),
      datasets: [
        {
          label: 'Total Profit',
          data: topProducts.map(product => product.total_profit),
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('60%', '50%')),
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: $${value.toFixed(2)}`;
          }
        }
      },
      title: {
        display: true,
        text: 'Product Profitability (Top 10)',
        font: {
          size: 16,
        }
      },
    },
  };

  // Fetch data when component mounts or filters/pagination changes
  useEffect(() => {
    fetchSales();
  }, [currentPage, filters]);

  // Fetch rentability data when component mounts
  useEffect(() => {
    fetchRentabilityData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
        <Link
          to="/inventory"
          className="bg-secondaryBlue text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Inventory
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={filters.payment_method}
              onChange={(e) => handleFilterChange('payment_method', e.target.value)}
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product ID
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={filters.product_id}
              onChange={(e) => handleFilterChange('product_id', e.target.value)}
              placeholder="Enter product ID"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              {tableHeaders.map((header, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={tableHeaders.length} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondaryBlue"></div>
                  </div>
                </td>
              </tr>
            ) : sales.length > 0 ? (
              sales.map((sale) => (
                <tr key={sale.sale_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.sale_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.product_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(sale.sale_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.payment_method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(sale.sale_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      to={`/products/${sale.product_id}`}
                      className="text-secondaryBlue hover:text-blue-700 mr-3"
                    >
                      View Product
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  No sales found matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-l ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 ${
                  currentPage === i + 1
                    ? 'bg-secondaryBlue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-r ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Rentability Chart Section */}
      <div className="mt-12 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Product Profitability Analysis</h2>
        
        {rentabilityLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondaryBlue"></div>
          </div>
        ) : rentabilityData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="h-80">
                <Pie data={prepareChartData()} options={chartOptions} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Top 5 Most Profitable Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rentability %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rentabilityData
                      .sort((a, b) => b.total_profit - a.total_profit)
                      .slice(0, 5)
                      .map((product) => (
                        <tr key={product.product_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link to={`/products/${product.product_id}`} className="text-secondaryBlue hover:underline">
                              {product.name || `Product #${product.product_id}`}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(product.total_profit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.sales_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.rentability_percentage > 20 ? 'bg-green-100 text-green-800' : 
                              product.rentability_percentage > 0 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.rentability_percentage.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No products with sales data found. Sell some products to see profitability analysis.
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
