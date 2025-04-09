import React from 'react'
import TableCol from '../TableCol/TableCol'
import TableRow from '../TableRow/TableRow'

const DeleteItemModal = ({deleteConfirmation, hideDeleteConfirmation, handleDeleteFunction}) => {
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={hideDeleteConfirmation}></div>
          <div className="bg-white rounded-lg z-20 p-6 w-full max-w-lg">
            <h2 className=" text-secondaryBlue font-Mulish font-black text-2xl mb-4">Confirm Deletion of the following item:</h2>
            
            <div className='overflow-x-auto relative'>
              <table className='mx-auto'>
                <thead className='font-Mulish font-black text-secondaryBlue'>
                  <TableRow>
                    <TableCol text='SKU' key='SKU'/>
                    <TableCol text='NAME' key='NAME'/>
                    <TableCol text='CONDITION' key='CONDITION'/>
                    <TableCol text='CATEGORY' key='CATEGORY'/>
                  </TableRow>
                </thead>
                <tbody className='font-Josefin align-middle'>
                  <TableRow>
                    <TableCol text={deleteConfirmation.item.sku} key={`sku-${deleteConfirmation.item.sku}`}/>
                    <TableCol text={deleteConfirmation.item.name} key={`name-${deleteConfirmation.item.sku}`}/>
                    <TableCol text={deleteConfirmation.item.condition} key={`cond-${deleteConfirmation.item.sku}`}/>
                    <TableCol text={deleteConfirmation.item.category?.category_name || 'Unknown'} key={`cat-${deleteConfirmation.item.sku}`}/>
                  </TableRow>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button 
                onClick={hideDeleteConfirmation}
                className="px-4 py-2 border rounded-md font-Mulish font-black text-secondaryBlue hover:text-white hover:bg-secondaryBlue"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteFunction}
                className="px-4 py-2 bg-red-600 text-mainRed border border-mainRed rounded-md font-Mulish font-black hover:text-white hover:bg-mainRed"
              >
                Delete
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}

export default DeleteItemModal