import React from 'react'

const TextInput = ({name, form, title, value, placeholder = '', onChange, readonly}) => {
  let nameLowercase = name.toLowerCase()

  return (
    readonly ? (
      <div className='grid my-3 p-3 items-center'>
        <label 
          className='text-secondaryBlue font-Mulish font-black text-2xl'
          htmlFor={form}
        >
          {title}
        </label>
        <input 
          className='w-full p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue'
          name={name}
          type='text'
          id={name}
          form={form}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          readOnly
        />
      </div>
    ) : (
      <div className='grid my-3 p-3 items-center'>
        <label 
          className='text-secondaryBlue font-Mulish font-black text-2xl'
          htmlFor={form}
        >
          {title}
        </label>
        <input 
          className='w-full p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue'
          name={name}
          type='text'
          id={name}
          form={form}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
        />
      </div>
    )
  )
}

export default TextInput