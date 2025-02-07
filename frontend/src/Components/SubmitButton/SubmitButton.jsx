import React from 'react'

const SubmitButton = ({ onClick }) => {
  return (
    <input type='submit' onClick={onClick} className='w-full p-3 font-Mulish font-black text-white text-xl border bg-gradient-radial from-secondaryBlue to-mainBlue md:max-w-15 lg:max-w-sm'/>
  )
}

export default SubmitButton