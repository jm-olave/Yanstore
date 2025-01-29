import React from 'react'

const TextAreaInput = ({name, form, title, value, onChange}) => {
  return (
    <div className='grid my-3 p-3 grid-rows-4 md:grid-cols-3 items-center lg:px-0'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl ' htmlFor={form}>{title}</label>
      <textarea className='w-full h-full flex text-start p-1 row-span-3 row-start text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue md:w-full md:col-span-2 md:col-start-2 md:row-span-3 lg:col-start-1 lg:row-start-2 lg:col-span-3'
            name={name}
            id={name} 
            form={form}
            placeholder={`Notes related to the product`}
            onChange={onChange}
            value={value}
      >
      </textarea>
    </div>
  )
}

export default TextAreaInput