import React from 'react'

const InputSelect = ({ name, options, title, value, form, onChange}) => {

  const InputSelectName = name
  const InputSelectOptions = options

  const handleOptionChange = (event) => {
    event.target.blur()
    onChange(event)
  }

  return (
    <div className='grid my-3 p-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl ' htmlFor={InputSelectName}>{title}</label>
      <select className='w-full p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue appearance-none bg-no-repeat bg-right bg-contain bg-downArrow focus:bg-upArrow'
              name={InputSelectName} 
              id={InputSelectName} 
              form={form}
              onChange={handleOptionChange}
              value={value}
      >
        {
          InputSelectOptions.map(({ value, label }) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))
        }
      </select>
    </div>
  )
}

export default InputSelect