import React from 'react'

const SellModal = ({PAYMENT_METHODS, selectedProduct, setSaleData, saleData, handleSell}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-secondaryBlue">Sell {selectedProduct.name}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
            <input
              type="number"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-secondaryBlue focus:ring focus:ring-secondaryBlue focus:ring-opacity-50"
              value={saleData.sale_price}
              onChange={(e) => setSaleData({...saleData, sale_price: e.target.value})}
              placeholder="Enter sale price"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-secondaryBlue focus:ring focus:ring-secondaryBlue focus:ring-opacity-50"
              value={saleData.payment_method}
              onChange={(e) => setSaleData({...saleData, payment_method: e.target.value})}
            >
              <option value="">Select payment method</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
            <input
              type="date"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-secondaryBlue focus:ring focus:ring-secondaryBlue focus:ring-opacity-50"
              value={saleData.sale_date}
              onChange={(e) => setSaleData({...saleData, sale_date: e.target.value})}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-secondaryBlue focus:ring focus:ring-secondaryBlue focus:ring-opacity-50"
              value={saleData.notes}
              onChange={(e) => setSaleData({...saleData, notes: e.target.value})}
              placeholder="Add sale notes"
              rows="3"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setSellModalOpen(false)}
            className="px-4 py-2 bg-red-600 text-mainRed border border-mainRed rounded-md font-Mulish font-black hover:text-white hover:bg-mainRed"
          >
            Cancel
          </button>
          <button
            onClick={handleSell}
            className="px-4 py-2 border rounded-md font-Mulish font-black text-secondaryBlue hover:text-white hover:bg-secondaryBlue"
          >
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  )
}

export default SellModal