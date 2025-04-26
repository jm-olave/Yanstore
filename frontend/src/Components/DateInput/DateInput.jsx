import React from 'react'

const DateInput = ({name, form, title, value, onChange}) => {
  return (
    <div className='grid my-3 p-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl ' htmlFor={form}>{title}</label>
      <input className='w-full p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue cursor-pointer'
            name={name} 
            id={name}
            type='date'
            form={form}
            onChange={onChange}
            value={value}
      >
      </input>
    </div>
  )
}

export default DateInput