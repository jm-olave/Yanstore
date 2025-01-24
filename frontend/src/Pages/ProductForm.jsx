import React from 'react'
import InputSelect from '../Components/InputSelect/InputSelect'

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
      <InputSelect name='Categories' options={options}/>
      <InputSelect name='Condition' options={conditions}/>
      <InputSelect name='Obtaining method' options={options}/>
    </div>
  )
}

export default ProductForm