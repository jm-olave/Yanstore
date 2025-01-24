import React from 'react'

const TextInput = ({name, form}) => {

  let nameLowercase = name.toLowerCase()

  return (
    <div className='grid my-3 p-3 md:grid-cols-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl ' htmlFor={form}>{name}</label>
      <input className='w-5/6 p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue md:w-full md:col-span-2 md:col-start-2'
            name={name} 
            id={name} 
            form={form}
            placeholder={`Enter the ${nameLowercase}`}
      >
      </input>
    </div>
  )
}

export default TextInput