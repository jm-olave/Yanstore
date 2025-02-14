import React, { createContext, useEffect, useState } from 'react'
import ProductCard from '../Components/ProductCard/ProductCard'
import TableRow from '../Components/TableRow/TableRow'
import TableCol from '../Components/TableCol/TableCol'
import { NavLink } from 'react-router'


let items = [
  {
    "name": "Tapete 1",
    "sku": "TA2502131902",
    "description": "Tapete comprado de contado",
    "condition": "Mint",
    "purchase_date": "2025-02-12",
    "obtained_method": "purchase",
    "product_id": 1,
    "category_id": 1,
    "edition": null,
    "rarity": null,
    "set_name": null,
    "set_code": null,
    "language": null,
    "is_active": true,
    "created_at": "2025-02-13T19:02:07.891599-05:00",
    "updated_at": "2025-02-13T19:02:07.891599-05:00",
    "category": {
      "category_name": "Tapetes",
      "parent_category_id": null,
      "category_id": 1,
      "created_at": "2025-02-13T19:01:23.592985-05:00",
      "updated_at": "2025-02-13T19:01:23.592985-05:00"
    },
    "current_price": null,
    "available_quantity": null
  },
  {
    "name": "Deckbox 1",
    "sku": "DE2502131908",
    "description": "deckbox comprada por subasta",
    "condition": "Mint",
    "purchase_date": "2025-02-12",
    "obtained_method": "audit",
    "product_id": 2,
    "category_id": 2,
    "edition": null,
    "rarity": null,
    "set_name": null,
    "set_code": null,
    "language": null,
    "is_active": true,
    "created_at": "2025-02-13T19:08:50.246703-05:00",
    "updated_at": "2025-02-13T19:08:50.246703-05:00",
    "category": {
      "category_name": "DeckBox",
      "parent_category_id": null,
      "category_id": 2,
      "created_at": "2025-02-13T19:01:30.989933-05:00",
      "updated_at": "2025-02-13T19:01:30.989933-05:00"
    },
    "current_price": null,
    "available_quantity": null
  },
  {
    "name": "Sleeves 1",
    "sku": "SL2502131909",
    "description": "Sleeves obtenidos por cambio",
    "condition": "Near Mint",
    "purchase_date": "2025-02-12",
    "obtained_method": "trade",
    "product_id": 3,
    "category_id": 3,
    "edition": null,
    "rarity": null,
    "set_name": null,
    "set_code": null,
    "language": null,
    "is_active": true,
    "created_at": "2025-02-13T19:09:56.510614-05:00",
    "updated_at": "2025-02-13T19:09:56.510614-05:00",
    "category": {
      "category_name": "Sleeves",
      "parent_category_id": null,
      "category_id": 3,
      "created_at": "2025-02-13T19:01:39.140814-05:00",
      "updated_at": "2025-02-13T19:01:39.140814-05:00"
    },
    "current_price": null,
    "available_quantity": null
  },
  {
    "name": "Tapete 2",
    "sku": "TA2502131912",
    "description": "Comprado en subasta",
    "condition": "Near Mint",
    "purchase_date": "2025-02-12",
    "obtained_method": "audit",
    "product_id": 4,
    "category_id": 1,
    "edition": null,
    "rarity": null,
    "set_name": null,
    "set_code": null,
    "language": null,
    "is_active": true,
    "created_at": "2025-02-13T19:12:33.235645-05:00",
    "updated_at": "2025-02-13T19:12:33.235645-05:00",
    "category": {
      "category_name": "Tapetes",
      "parent_category_id": null,
      "category_id": 1,
      "created_at": "2025-02-13T19:01:23.592985-05:00",
      "updated_at": "2025-02-13T19:01:23.592985-05:00"
    },
    "current_price": null,
    "available_quantity": null
  }
]
const Inventory = () => {
  const [products, setProducts] = useState([])

  const getProducts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      return data

    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to fetch categories: ${error.message}` 
      })
      return []
    }
  }

  useEffect(() => {
      const fetchData = async () => {
        const data = await getProducts()
        setProducts(data)
      }
      fetchData()
    }, [])

  return (
    <div className="w-full overflow-x-hidden">
      <section className='w-11/12 mx-auto max-w-5xl'>
        <div className='overflow-x-auto relative'>
          <table className='w-full min-w-[800px]'>
            <thead className='font-Mulish font-black text-secondaryBlue'>
              <TableRow>
                <TableCol text='NAME' key='NAME'/>
                <TableCol text='SKU' key='SKU'/>
                <TableCol text='PRICE' key='PRICE'/>
                <TableCol text='DESC' key='DESC'/>
                <TableCol text='CONDITION' key='CONDITION'/>
                <TableCol text='CATEGORY' key='CATEGORY'/>
                <TableCol text='OBT METHOD' key='OBT-METHOD'/>
                <TableCol text='CUANTITY' key='CUANTITY'/>
                <TableCol text='EDIT' key='EDIT'/>
              </TableRow>
            </thead>
            <tbody className='font-Josefin align-middle'>
              {
                products.map(items => (
                  <TableRow key={items.sku}>                
                    <TableCol text={items.name} key={`name-${items.sku}`}/>
                    <TableCol text={items.sku} key={`sku-${items.sku}`}/>
                    <TableCol text={items.current_price} key={`price-${items.sku}`}/>
                    <TableCol text={items.description} key={`desc-${items.sku}`}/>
                    <TableCol text={items.condition} key={`cond-${items.sku}`}/>
                    <TableCol text={items.category.category_name} key={`cat-${items.sku}`}/>
                    <TableCol text={items.obtained_method} key={`cat-${items.sku}`}/>
                    <TableCol text={"1"} key={`quantity-${items.sku}`}/>
                    <TableCol key={`edit-${items.sku}`}>
                      <NavLink key={`${items.sku}-edit`}>Edit</NavLink>
                    </TableCol>
                    
                  </TableRow>
                ))
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Inventory