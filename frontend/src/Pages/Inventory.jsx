import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import TableRow from '../Components/TableRow/TableRow'
import TableCol from '../Components/TableCol/TableCol'
import ModalImage from '../Components/ModalImage/ModalImage'
import TestImage from '../Images/ImagePlaceholder.png'

// Get API URL from environment variables or use a default
const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const Inventory = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })
  const [modalData, setModalData] = useState({
    open: false,
    img: '',
    caption: '',
  })

  const modalHandler = (e) => {
    const productData = e.currentTarget.getAttribute('data-product')
    
    try {
      const product = JSON.parse(productData)
      
      if (modalData.open === false) {
        setModalData({
          open: true,
          img: TestImage, // Use actual image data when available
          caption: product.name,
        })
      } else {
        setModalData({
          open: false,
          img: '',
          caption: '',
        })
      }
    } catch (error) {
      console.error('Error parsing product data:', error)
    }
  }

  const getProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching products from:', `${apiURL}/products/`)
      
      const response = await fetch(`${apiURL}/products/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Products data:', data)
      return data

    } catch (error) {
      console.error('Error fetching products:', error)
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to fetch products: ${error.message}` 
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const data = await getProducts()
      setProducts(data)
    }
    fetchData()
  }, [])

  // Sample data in case the API call fails
  const fallbackItems = [
    {
      "name": "Tapete 1",
      "sku": "TA2502131902",
      "description": "Tapete comprado de contado",
      "condition": "Mint",
      "purchase_date": "2025-02-12",
      "obtained_method": "purchase",
      "product_id": 1,
      "category_id": 1,
      "is_active": true,
      "category": {
        "category_name": "Tapetes",
        "category_id": 1
      }
    },
    {
      "name": "Deckbox 1",
      "sku": "DE2502131908",
      "description": "deckbox comprada por subasta",
      "condition": "Mint",
      "purchased_date": "2025-02-12",
      "obtained_method": "audit",
      "product_id": 2,
      "category_id": 2,
      "is_active": true,
      "category": {
        "category_name": "DeckBox",
        "category_id": 2
      }
    }
  ]

  // Use the fetched products if available, otherwise use fallback data
  const displayItems = products.length > 0 ? products : fallbackItems

  return (
    <>
      <ModalImage data={modalData} handler={modalHandler}/>
      <div className="w-full overflow-x-hidden">
        {submitStatus.message && (
          <div className={`mb-4 p-4 rounded-md ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {submitStatus.message}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">
            <p>Loading inventory data...</p>
          </div>
        ) : (
          <section className='w-11/12 mx-auto max-w-7xl'>
            <div className='overflow-x-auto relative'>
              <table className='w-full min-w-[800px]'>
                <thead className='font-Mulish font-black text-secondaryBlue'>
                  <TableRow>
                    <TableCol text='SKU' key='SKU'/>
                    <TableCol text='NAME' key='NAME'/>
                    <TableCol text='DESC' key='DESC'/>
                    <TableCol text='CONDITION' key='CONDITION'/>
                    <TableCol text='CATEGORY' key='CATEGORY'/>
                    <TableCol text='OBT METHOD' key='OBT-METHOD'/>
                    <TableCol text='LOCATION' key='LOCATION'/>
                    <TableCol text='IMAGE' key='IMAGE'/>
                    <TableCol text='EDIT' key='EDIT'/>
                    <TableCol text='DELETE' key='DELETE'/>
                  </TableRow>
                </thead>
                <tbody className='font-Josefin align-middle'>
                  {displayItems.map(item => (
                    <TableRow key={item.sku || `item-${item.product_id}`}>            
                      <TableCol text={item.sku} key={`sku-${item.sku}`}/>
                      <TableCol text={item.name} key={`name-${item.sku}`}/>
                      <TableCol text={item.description} key={`desc-${item.sku}`}/>
                      <TableCol text={item.condition} key={`cond-${item.sku}`}/>
                      <TableCol text={item.category?.category_name || 'Unknown'} key={`cat-${item.sku}`}/>
                      <TableCol text={item.obtained_method} key={`ob_me-${item.sku}`}/>
                      <TableCol text={item.location || "N/A"} key={`location-${item.sku}`}/>
                      <TableCol key={`image-${item.sku}`}>
                        <button 
                          onClick={modalHandler} 
                          data-product={JSON.stringify(item)}
                          className='text-secondaryBlue font-bold cursor-pointer'
                        >
                          View
                        </button>
                      </TableCol>
                      <TableCol key={`edit-${item.sku}`}>
                        <Link 
                          className='text-secondaryBlue font-bold' 
                          to={`/edit-product/${item.product_id}`}
                        >
                          Edit
                        </Link>
                      </TableCol>
                      <TableCol key={`delete-${item.sku}`}>
                        <button className='text-mainRed font-bold'>Delete</button>
                      </TableCol>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

export default Inventory