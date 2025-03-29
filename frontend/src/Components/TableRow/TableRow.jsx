import React from 'react'
import TableCol from '../TableCol/TableCol'

const TableRow = ({ children, className }) => {
  return (
    <tr className={`text-center ${className}`}>
        {children}
    </tr>
  )
}

export default TableRow