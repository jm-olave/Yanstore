import React, { useState } from 'react'
import InputSelect from '../Components/SelectInput/InputSelect'
import TextInput from '../Components/TextInput/TextInput'
import DateInput from '../Components/DateInput/DateInput'
import ImageInput from '../Components/ImageInput/ImageInput'
import TextAreaInput from '../Components/TextAreaInput/TextAreaInput'
import SubmitButton from '../Components/SubmitButton/SubmitButton'

const ProductForm = () => {

  let options = [
    'Select Option',
    'Deckbox',
    'Playmat',
    'Sleeves'
  ]

  let conditions = [
    'Select Option',
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
    categories: 'Select Option',
    condition: 'Select Option',
    obtainingMethod: 'Select Option',
    purchaseDate: '',
    image: '',
    notes: '',
  })

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
    console.log(e.target.name)
    console.log(e.target.value)
  }

  console.log(form)

  return (
    <form className='w-11/12 pb-11 mx-auto lg:grid lg:grid-cols-2 lg:gap-4 lg:max-w-5xl'>
      <div className='flex flex-col justify-evenly'>
        <TextInput name='name' title='Name' value={form.name} onChange={handleFormChange}/>
        <InputSelect name='categories' title='Categories' value={form.categories} options={options} onChange={handleFormChange}/>
        <InputSelect name='condition' title='Condition' value={form.condition} options={conditions} onChange={handleFormChange}/>
      </div>
      <div className='flex flex-col'>
        <InputSelect name='obtainingMethod' title='Obtaining Method' value={form.obtainingMethod} options={options} onChange={handleFormChange}/>
        <DateInput name='purchaseDate' title='Purchase Date' value={form.purchaseDate} onChange={handleFormChange}/>
        <ImageInput name='image' title='Image' value={form.image} onChange={handleFormChange}/>
      </div>
      
      <div className='lg:col-span-2'>
        <TextAreaInput name='notes' title='Notes' value={form.notes} onChange={handleFormChange}/>
      </div>

      <div className='w-2/3 mt-8 mx-auto max-w-xs lg:col-start-2 lg:m-0 lg:justify-self-end'>
        <SubmitButton text={'ADD PRODUCT'}/>
      </div>
    </form>
  )
}

export default ProductForm