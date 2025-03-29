import React from 'react'

const NumberInput = ({name, form, title, value, onChange}) => {
  return (
    <div className='grid md:grid-cols-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl ' htmlFor={form}>{title}</label>
      <input className='w-full p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue md:w-full md:col-span-2 md:col-start-2'
            name={name} 
            type='number'
            id={name} 
            form={form}
            min="0.01" 
            step="0.01"
            onChange={onChange}
            value={value}
      >
      </input>
    </div>
  )
}

export default NumberInput