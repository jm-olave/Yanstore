import React from 'react'

const DateInput = ({name, form}) => {
  return (
    <div className='grid my-3 p-3 md:grid-cols-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl ' htmlFor={form}>{name}</label>
      <input className='w-5/6 p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue md:w-full md:col-span-2 md:col-start-2'
            name={name} 
            id={name}
            type='date'
            form={form}
      >
      </input>
    </div>
  )
}

export default DateInput