import React from 'react'
import InputSelect from '../Components/SelectInput/InputSelect'
import TextInput from '../Components/TextInput/TextInput'
import DateInput from '../Components/DateInput/DateInput'
import ImageInput from '../Components/ImageInput/ImageInput'
import TextAreaInput from '../Components/TextAreaInput/TextAreaInput'

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

  return (
    <div>
      <TextInput name='Name'/>
      <InputSelect name='Categories' options={options}/>
      <InputSelect name='Condition' options={conditions}/>
      <InputSelect name='Obtaining Method' options={options}/>
      <DateInput name='Purchase Date'/>
      <ImageInput name='Image'/>
      <TextAreaInput name='Notes'/>
    </div>
  )
}

export default ProductForm