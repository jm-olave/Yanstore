import React from 'react'
import InputSelect from '../Components/InputSelect/InputSelect'
import TextInput from '../Components/TextInput/TextInput'

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
      <InputSelect name='Obtaining method' options={options}/>
    </div>
  )
}

export default ProductForm