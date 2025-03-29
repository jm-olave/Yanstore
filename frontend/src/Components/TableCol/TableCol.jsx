import React from 'react'

const TableCol = ({ text, children, onClick, className }) => {
  return (
    <td className={`p-2 border border-secondaryBlue`} onClick={onClick}>
        {
            children ? children : text
        }
    </td>
  )
}

export default TableCol