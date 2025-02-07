import React from 'react'
import ProductCard from '../Components/ProductCard/ProductCard'

const Inventory = () => {

  let items = [
    {
      id: '1',
      name: 'Playmat Mago Oscuro',
      price: 30,
      notes: 'dasdsad sadasdsa dadasdasdasda',
      img: ''
    },
    {
      id: '2',
      name: 'Playmat Mago Oscuro',
      price: 30,
      notes: 'dasdsadad asdsadadas dasdasda',
      img: ''
    },
    {
      id: '3',
      name: 'Playmat Mago Oscuro',
      price: 30,
      notes: 'dasds adadasds adadasda sdasda',
      img: ''
    },
    {
      id: '4',
      name: 'Playmat Mago Oscuro',
      price: 30,
      notes: 'dasds adadasdsa dadasd asdasda',
      img: ''
    },
    {
      id: '5',
      name: 'Playmat Mago Oscuro',
      price: 30,
      notes: 'dasds adadas dsadada sdasdasda',
      img: ''
    }
  ]

  return (
    <div className='grid mt-4 mx-auto w-11/12 max-w-screen-2xl md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {
        items.map(item => (
          <ProductCard name={item.name} price={item.price} notes={item.notes} key={item.id}/>
        ))
      }
    </div>
  )
}

export default Inventory