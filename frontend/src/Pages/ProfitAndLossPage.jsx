import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';

const ProfitAndLossPage = () => {
  const [pnlData, setPnlData] = useState([]);
  const { fetchData, loading, error } = useApi();

  useEffect(() => {
    const loadPnlData = async () => {
      try {
        const data = await fetchData('/profit-and-loss/');
        if (Array.isArray(data)) {
          setPnlData(data);
        } else {
          console.error("Fetched data is not an array:", data);
          setPnlData([]); // Set to empty array if data is not as expected
        }
      } catch (err) {
        // Error is already set by useApi, but you could log it or handle it further here
        console.error("Failed to fetch P&L data:", err);
        setPnlData([]); // Ensure data is empty on error
      }
    };

    loadPnlData();
  }, [fetchData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Assuming dateString is 'YYYY-MM-DD'
    const date = new Date(dateString);
    // Adjust for timezone issues if date appears off by one day
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' });
  };

  const formatNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 'N/A' : num.toFixed(2);
  };

  const tableHeaders = [
    "Month", "Gross Sales", "Sales Discounts", "Shipping Income", "Shipping Expense",
    "Gross Profit", "Beginning Inventory Value", "Purchases Colombia", "Purchases USA",
    "Ending Inventory Value", "Cost of Sales", "Payroll Payments",
    "Net Income Without Operations", "Costs And Expenses", "Income",
    "Operating Income", "Tax Collection", "Reserve Collection", "Net Income"
  ];

  const dataKeys = [
    "month", "gross_sales", "sales_discounts", "shipping_income", "shipping_expense",
    "gross_profit", "beginning_inventory_value", "purchases_colombia", "purchases_usa",
    "ending_inventory_value", "cost_of_sales", "payroll_payments",
    "net_income_without_operations", "costs_and_expenses", "income",
    "operating_income", "tax_collection", "reserve_collection", "net_income"
  ];

  if (loading) {
    return <div className="container mx-auto p-4">Loading P&L data...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error fetching P&L data: {error.message || error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profit and Loss Statements</h1>
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
