import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';

const ProfitAndLossPage = () => {
  const [pnlData, setPnlData] = useState([]);
  const { fetchData, loading: getLoading, error: getError } = useApi(); // Renamed for clarity

  // State for month input and POST operation
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2); // "YYYY-MM"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState({ type: '', text: '' });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadPnlData = async () => {
      try {
        const data = await fetchData('/profit-and-loss/');
        if (Array.isArray(data)) {
          setPnlData(data);
        } else {
          console.error("Fetched P&L data is not an array:", data);
          setPnlData([]);
        }
      } catch (err) {
        console.error("Failed to fetch P&L data:", err);
        setPnlData([]);
      }
    };

    loadPnlData();
  }, [fetchData, refreshKey]); // Added refreshKey to dependency array

  const handleGeneratePnl = async () => {
    if (!selectedMonth) {
      setGenerationMessage({ type: 'error', text: 'Please select a month.' });
      return;
    }
    // Basic validation for "YYYY-MM" format
    if (!/^\d{4}-\d{2}$/.test(selectedMonth)) {
        setGenerationMessage({ type: 'error', text: 'Invalid month format. Please use YYYY-MM.' });
        return;
    }

    setIsGenerating(true);
    setGenerationMessage({ type: '', text: '' });
    try {
      await fetchData('/profit-and-loss/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month: selectedMonth }),
      });
      setGenerationMessage({ type: 'success', text: `P&L statement for ${selectedMonth} generated/updated successfully.` });
      setRefreshKey(prevKey => prevKey + 1); // Trigger re-fetch
    } catch (err) {
      setGenerationMessage({ type: 'error', text: err.message || 'Failed to generate P&L statement.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' });
  };

  const formatNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 'N/A' : num.toFixed(2);
  };

  const tableHeaders = [
    "Month", "Gross Sales", "Sales Discounts", "Shipping Expense", // Removed "Shipping Income"
    "Gross Profit", "Beginning Inventory Value", "Purchases Colombia", "Purchases USA",
    "Ending Inventory Value", "Cost of Sales", "Payroll Payments",
    // Removed "Net Income Without Operations"
    "Costs And Expenses", "Income", "Operating Income", 
    "Tax Collection", "Reserve Collection", "Net Income"
  ];

  const dataKeys = [
    "month", "gross_sales", "sales_discounts", "shipping_expense", // Removed "shipping_income"
    "gross_profit", "beginning_inventory_value", "purchases_colombia", "purchases_usa",
    "ending_inventory_value", "cost_of_sales", "payroll_payments",
    // Removed "net_income_without_operations"
    "costs_and_expenses", "income", "operating_income",
    "tax_collection", "reserve_collection", "net_income"
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profit and Loss Statements</h1>

      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Generate P&L Statement</h2>
        <div className="flex items-center space-x-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleGeneratePnl}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-150 ease-in-out"
          >
            {isGenerating ? 'Generating...' : 'Generate/Refresh P&L for Selected Month'}
          </button>
        </div>
        {generationMessage.text && (
          <div className={`mt-3 p-3 rounded-md text-sm ${
            generationMessage.type === 'success' ? 'bg-green-100 text-green-700' : 
            generationMessage.type === 'error' ? 'bg-red-100 text-red-700' : ''
          }`}>
            {generationMessage.text}
          </div>
        )}
      </div>
      
      {getLoading && <div className="text-center py-4">Loading P&L data...</div>}
      {getError && <div className="text-center py-4 text-red-500">Error fetching P&L data: {getError.message || getError}</div>}

      {!getLoading && !getError && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-gray-100">
            <tr>
              {tableHeaders.map(header => (
                <th key={header} className="p-3 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pnlData.length > 0 ? (
              pnlData.map((row, rowIndex) => (
                <tr key={row.pnl_id || rowIndex} className="hover:bg-gray-50">
                  {dataKeys.map(key => (
                    <td key={key} className="p-3 border-b border-gray-200 text-sm text-gray-700">
                      {key === 'month' ? formatDate(row[key]) : formatNumber(row[key])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="p-3 text-center text-gray-500">
                  No Profit and Loss data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitAndLossPage;
