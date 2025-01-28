import React, { useState } from 'react'
import InputSelect from '../Components/SelectInput/InputSelect'
import TextInput from '../Components/TextInput/TextInput'
import DateInput from '../Components/DateInput/DateInput'
import ImageInput from '../Components/ImageInput/ImageInput'
import TextAreaInput from '../Components/TextAreaInput/TextAreaInput'
import SubmitButton from '../Components/SubmitButton/SubmitButton'

const ProductForm = () => {

  let options = [
    'Deckbox',
    'Playmat',
    'Sleeves'
  ]

  let conditions = [
    'Mint',
    'Near Mint',
    'Excelent',
    'Good',
    'Lightly Played',
    'Played',
    'Poor'
  ]

  const [form, setForm] = useState({
    name: '',
    categories: '',
    condition: '',
    obtainingMethod: '',
    purchaseDate: '',
    image: '',
    notes: '',
  })

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

    console.log(form)
  }

  return (
    <form className='w-11/12 pb-11 mx-auto lg:grid lg:grid-cols-2 lg:gap-4 lg:max-w-5xl'>
      <div className='flex flex-col justify-evenly'>
        <TextInput name='Name' onChange={handleFormChange}/>
        <InputSelect name='Categories' options={options} onChange={handleFormChange}/>
        <InputSelect name='Condition' options={conditions} onChange={handleFormChange}/>
      </div>
      <div className='flex flex-col'>
        <InputSelect name='Obtaining Method' options={options} onChange={handleFormChange}/>
        <DateInput name='Purchase Date' onChange={handleFormChange}/>
        <ImageInput name='Image' onChange={handleFormChange}/>
      </div>
      
      <div className='lg:col-span-2'>
        <TextAreaInput name='Notes' onChange={handleFormChange}/>
      </div>

      <div className='w-2/3 mt-8 mx-auto max-w-xs lg:col-start-2 lg:m-0 lg:justify-self-end'>
        <SubmitButton text={'ADD PRODUCT'}/>
      </div>
    </form>
  )
}

export default ProductForm