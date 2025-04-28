import React from 'react'
import TableCol from '../TableCol/TableCol'
import TableRow from '../TableRow/TableRow'

const DeleteItemModal = ({deleteConfirmation, hideDeleteConfirmation, handleDeleteFunction, headers}) => {

  const getItemData = (item, headers = []) => {
    if (!item || typeof item !== 'object') {
      console.warn("getItemData: Invalid input. Expected an object.", item);
      return [];
    }
  
    const data = [];
    const headerSet = new Set(headers);
    const includeAllHeaders = headers.length === 0; // Determine this *once*
  
    for (const [key, value] of Object.entries(item)) {
      if (includeAllHeaders || headerSet.has(key.toLocaleUpperCase())) { // Use the boolean variable
        data.push({
          header: key,
          value: value
        });
      }
    }
  
    return data;
  };

  let data = getItemData(deleteConfirmation.item, headers)
  console.log(deleteConfirmation.item)
  console.log(headers)
  console.log(data)

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
                    {data.map((item) => (
                      <TableCol text={item.header.toLocaleUpperCase()} key={item.header.toLocaleUpperCase()}/>
                    ))}
                  </TableRow>
                </thead>
                <tbody className='font-Josefin align-middle'>
                  <TableRow>
                    {data.map((item) => (
                      <TableCol text={item.value} key={item.value}/>
                    ))}
                    
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