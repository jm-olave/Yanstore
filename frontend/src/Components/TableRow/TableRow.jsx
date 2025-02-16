import React from 'react'
import TableCol from '../TableCol/TableCol'

const TableRow = ({ children }) => {
  return (
    <tr className='text-center'>
        {children}
    </tr>
  )
}

export default TableRow