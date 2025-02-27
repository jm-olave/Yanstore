import React from 'react'

const DeleteProductModal = ({deleteConfirmation, hideDeleteConfirmation, handleDeleteProduct}) => {
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={hideDeleteConfirmation}></div>
          <div className="bg-white rounded-lg z-20 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirmation.productName}</span>?
              This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={hideDeleteConfirmation}
                className="px-4 py-2 border rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}

export default DeleteProductModal