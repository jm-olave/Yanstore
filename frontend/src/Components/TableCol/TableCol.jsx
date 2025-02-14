import React from 'react'

const TableCol = ({ text, children }) => {
  return (
    <td className='p-2 border border-secondaryBlue'>
        {
            children ? children : text
        }
    </td>
  )
}

export default TableCol