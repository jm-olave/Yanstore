import React from 'react'

const NumberInput = ({name, form, title, value, onChange, min = "0"}) => {
  return (
    <div className='grid my-3 p-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-xl ' htmlFor={form}>{title}</label>
      <input className='w-full p-1 text-black font-Mulish font-semibold text-lg border-4 border-secondaryBlue'
            name={name} 
            type='number'
            id={name} 
            form={form}
            min={min}
            step="0.01"
            onChange={onChange}
            value={value}
      >
      </input>
    </div>
  )
}

export default NumberInput
