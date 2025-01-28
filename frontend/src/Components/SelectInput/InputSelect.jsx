import React from 'react'

const InputSelect = ({ name, options, form, onChange}) => {

  const InputSelectName = name
  const InputSelectOptions = options

  const handleOptionChange = (event) => {
    event.target.blur()
    onChange()
  }

  return (
    <div className='grid my-3 p-3 md:grid-cols-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl ' htmlFor={InputSelectName}>{InputSelectName}</label>
      <select className='w-5/6 p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue appearance-none bg-no-repeat bg-right bg-contain bg-downArrow focus:bg-upArrow md:w-full md:col-span-2 md:col-start-2'
              name={InputSelectName} 
              id={InputSelectName} 
              form={form}
              onChange={handleOptionChange}
      >
        {
          InputSelectOptions.map(item => (
            <option value={item} key={item}>
              {item}
            </option>
          ))
        }
      </select>
    </div>
  )
}

export default InputSelect