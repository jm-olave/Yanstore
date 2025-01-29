import React from 'react'

const InputSelect = ({ name, options, title, value, form, onChange}) => {

  const InputSelectName = title
  const InputSelectOptions = options

  const handleOptionChange = (event) => {
    event.target.blur()
    onChange(event)
  }

  return (
    <div className='grid my-3 p-3 md:grid-cols-3 items-center'>
      <label className='text-secondaryBlue font-Mulish font-black text-2xl ' htmlFor={InputSelectName}>{InputSelectName}</label>
      <select className='w-full p-1 text-black font-Mulish font-semibold text-xl border-4 border-secondaryBlue appearance-none bg-no-repeat bg-right bg-contain bg-downArrow focus:bg-upArrow md:w-full md:col-span-2 md:col-start-2'
              name={InputSelectName} 
              id={InputSelectName} 
              form={form}
              onChange={handleOptionChange}
              value={value}
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