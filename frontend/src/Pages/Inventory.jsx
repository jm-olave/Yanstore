import React, { createContext, useEffect, useState } from 'react'
import ProductCard from '../Components/ProductCard/ProductCard'
import TableRow from '../Components/TableRow/TableRow'
import TableCol from '../Components/TableCol/TableCol'
import { NavLink } from 'react-router'
import ModalImage from '../Components/ModalImage/ModalImage'
import TestImage from '../Images/ImagePlaceholder.png'

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

const apiURL = import.meta.env.VITE_API_URL

const Inventory = () => {
  const [products, setProducts] = useState([])
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })
  const [modalData, setModalData] = useState({
    open: false,
    img: '',
    caption: ''
  })

  const modalHandler = (e, itemData = null) => {
    if (itemData) {
      // Opening modal with image
      setModalData({
        open: true,
        img: TestImage, // Using placeholder image for now
        caption: itemData.name
      })
    } else {
      // Closing modal
      setModalData({
        open: false,
        img: '',
        caption: ''
      })
    }
  }

  const getProducts = async () => {
    try {
      const response = await fetch(`${apiURL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
        message: `Failed to fetch products: ${error.message}` 
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
    <>
      <ModalImage data={modalData} handler={modalHandler}/>
      <div className="w-full overflow-x-hidden">
        {submitStatus.message && (
          <div className={`mb-4 p-4 rounded-md ${
            submitStatus.type === 'error' 
              ? 'bg-red-50 text-red-700' 
              : 'bg-green-50 text-green-700'
          }`}>
            {submitStatus.message}
          </div>
        )}
        <section className='w-11/12 mx-auto max-w-7xl'>
          <div className='overflow-x-auto relative'>
            <table className='w-full min-w-[800px]'>
              <thead className='font-Mulish font-black text-secondaryBlue'>
                <TableRow>
                  <TableCol text='SKU'/>
                  <TableCol text='NAME'/>
                  <TableCol text='DESC'/>
                  <TableCol text='CONDITION'/>
                  <TableCol text='CATEGORY'/>
                  <TableCol text='OBT METHOD'/>
                  <TableCol text='LOCATION'/>
                  <TableCol text='IMAGE'/>
                  <TableCol text='EDIT'/>
                  <TableCol text='DELETE'/>
                </TableRow>
              </thead>
              <tbody className='font-Josefin align-middle'>
                {items.map(item => (
                  <TableRow key={item.sku}>            
                    <TableCol text={item.sku}/>
                    <TableCol text={item.name}/>
                    <TableCol text={item.description}/>
                    <TableCol text={item.condition}/>
                    <TableCol text={item.category?.category_name}/>
                    <TableCol text={item.obtained_method}/>
                    <TableCol text={"Colombia"}/>
                    <TableCol>
                      <div 
                        onClick={(e) => modalHandler(e, item)} 
                        className='text-secondaryBlue font-bold cursor-pointer hover:text-blue-700'
                      >
                        View Image
                      </div>
                    </TableCol>
                    <TableCol>
                      <NavLink 
                        className='text-secondaryBlue font-bold hover:text-blue-700'
                        to={`/edit-product/${item.product_id}`}
                      >
                        Edit
                      </NavLink>
                    </TableCol>
                    <TableCol>
                      <button 
                        className='text-mainRed font-bold hover:text-red-700'
                        onClick={() => console.log('delete to do')}
                      >
                        Delete
                      </button>
                    </TableCol>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}

export default Inventory