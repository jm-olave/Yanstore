import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import TableRow from '../Components/TableRow/TableRow'
import TableCol from '../Components/TableCol/TableCol'
import ModalImage from '../Components/ModalImage/ModalImage'
import TestImage from '../Images/ImagePlaceholder.png'
import DeleteProductModal from '../Components/DeleteProductModal/DeleteProductModal'

// Get API URL from environment variables or use a default
const apiURL = 'https://yanstore-api-6e6412b99156.herokuapp.com/'

const Inventory = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })
  const [modalData, setModalData] = useState({
    open: false,
    img: '',
    caption: '',
    productId: null
  })

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    productId: null,
    productName: ''
  })

  const modalHandler = (productId, productName) => {
    if (modalData.open === false) {
      // When opening the modal, set the product ID and name
      setModalData({
        open: true,
        img: `${apiURL}/products/${productId}/image`,
        caption: productName,
        productId: productId
      })
    } else {
      // When closing the modal
      setModalData({
        open: false,
        img: '',
        caption: '',
        productId: null
      })
    }
  }

  const getProducts = async () => {
    try {
      setLoading(true)
      
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

  const showDeleteConfirmation = (productId, productName) => {
    setDeleteConfirmation({
      show: true,
      productId,
      productName
    })
  }

  const hideDeleteConfirmation = () => {
    setDeleteConfirmation({
      show: false,
      productId: null,
      productName: ''
    })
  }

  const handleDeleteProduct = async () => {
    try {
      const productId = deleteConfirmation.productId
      
      if (!productId) return
      
      const response = await fetch(`${apiURL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      // Remove the product from the state
      setProducts(products.filter(product => product.product_id !== productId))
      
      setSubmitStatus({ 
        type: 'success', 
        message: result.message || 'Product successfully deleted' 
      })
      
      // Hide the confirmation dialog
      hideDeleteConfirmation()
      
    } catch (error) {
      console.error('Error deleting product:', error)
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to delete product: ${error.message}` 
      })
      
      // Hide the confirmation dialog
      hideDeleteConfirmation()
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const data = await getProducts()
      setProducts(data)
    }
    fetchData()
  }, [])

  // Use the fetched products or the items array as fallback
  const displayItems = products

  return (
    <>
      <ModalImage data={modalData} handler={modalHandler}/>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (<DeleteProductModal deleteConfirmation={deleteConfirmation} hideDeleteConfirmation={hideDeleteConfirmation} handleDeleteProduct={handleDeleteProduct} />)}
      
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
                  {displayItems.map(items => (
                    <TableRow key={items.sku}>            
                      <TableCol text={items.sku} key={`sku-${items.sku}`}/>
                      <TableCol text={items.name} key={`name-${items.sku}`}/>
                      <TableCol text={items.description} key={`desc-${items.sku}`}/>
                      <TableCol text={items.condition} key={`cond-${items.sku}`}/>
                      <TableCol text={items.category.category_name} key={`cat-${items.sku}`}/>
                      <TableCol text={items.obtained_method} key={`ob_me-${items.sku}`}/>
                      <TableCol text={items.location || "Colombia"} key={`location-${items.sku}`}/>
                      <TableCol key={`image-${items.sku}`}>
                        <div onClick={() => modalHandler(items.product_id, items.name)} className='text-secondaryBlue font-bold cursor-pointer'>
                          Image
                        </div>
                      </TableCol>
                      <TableCol key={`edit-${items.sku}`}>
                        <Link className='text-secondaryBlue font-bold' to={`/edit-product/${items.product_id}`}>
                          Edit
                        </Link>
                      </TableCol>
                      <TableCol key={`delete-${items.sku}`}>
                        <div 
                          className='text-mainRed font-bold cursor-pointer'
                          onClick={() => showDeleteConfirmation(items.product_id, items.name)}
                        >
                          Delete
                        </div>
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