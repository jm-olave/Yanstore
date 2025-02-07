import React from 'react'

const ImageInput = ({name, title, value, form, onChange}) => {
  return (
    <div className='grid my-3 p-3 md:grid-cols-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl' htmlFor={name}>{title}</label>
      <input className='w-full file:p-2 file:my-2 file:text-white file:border file:bg-gradient-radial file:font-Mulish file:font-black from-secondaryBlue to-mainBlue md:w-full md:col-span-2 md:col-start-2'
            name={name} 
            id={name}
            type='file'
            accept='image/*'
            form={form}
            onChange={onChange}
            value={value}
      >
      </input>
    </div>
  )
}

export default ImageInput