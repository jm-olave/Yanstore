import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import TableRow from '../Components/TableRow/TableRow';
import TableCol from '../Components/TableCol/TableCol';
import ModalImage from '../Components/ModalImage/ModalImage';
import DeleteItemModal from '../Components/DeleteItemModal/DeleteItemModal';
import useApi from '../hooks/useApi';

const Inventory = () => {
  const { loading: apiLoading, error: apiError, getProducts, deleteProduct } = useApi();
  
  const [products, setProducts] = useState([]);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const loading = apiLoading;
  
  const [modalData, setModalData] = useState({
    open: false,
    img: '',
    caption: '',
    productId: null
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    productId: null,
    productName: ''
  });

  // Handle opening/closing the image modal
  const modalHandler = (productId, productName) => {
    if (modalData.open === false) {
      // When opening the modal, set the product ID and name
      setModalData({
        open: true,
        img: `${import.meta.env.VITE_API_URL}/products/${productId}/image`,
        caption: productName,
        productId: productId
      });
    } else {
      // When closing the modal
      setModalData({
        open: false,
        img: '',
        caption: '',
        productId: null
      });
    }
  };

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
        setSubmitStatus({ type: '', message: '' });
      } catch (error) {
        console.error('Error loading products:', error);
        setSubmitStatus({
          type: 'error',
          message: `Failed to load products: ${error.message}`
        });
      }
    };

    loadProducts();
  }, [getProducts]);

  // Show delete confirmation dialog
  const showDeleteConfirmation = (productId, productName) => {
    setDeleteConfirmation({
      show: true,
      productId,
      productName
    });
  };

  // Hide delete confirmation dialog
  const hideDeleteConfirmation = () => {
    setDeleteConfirmation({
      show: false,
      productId: null,
      productName: ''
    });
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    try {
      const productId = deleteConfirmation.productId;
      
      if (!productId) return;
      
      const result = await deleteProduct(productId);
      
      // Remove the product from the state
      setProducts(products.filter(product => product.product_id !== productId));
      
      setSubmitStatus({
        type: 'success',
        message: result.message || 'Product successfully deleted'
      });
      
      // Hide the confirmation dialog
      hideDeleteConfirmation();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      setSubmitStatus({
        type: 'error',
        message: `Failed to delete product: ${error.message}`
      });
      
      // Hide the confirmation dialog
      hideDeleteConfirmation();
    }
  };

  // Display any API errors
  useEffect(() => {
    if (apiError) {
      setSubmitStatus({
        type: 'error',
        message: apiError
      });
    }
  }, [apiError]);

  return (
    <>
      <ModalImage data={modalData} handler={modalHandler} />
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <DeleteItemModal 
          deleteConfirmation={deleteConfirmation} 
          hideDeleteConfirmation={hideDeleteConfirmation} 
          handleDeleteFunction={handleDeleteProduct} 
        />
      )}
      
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
                    <TableCol text='CONDITION' key='CONDITION'/>
                    <TableCol text='CATEGORY' key='CATEGORY'/>
                    <TableCol text='OBT METHOD' key='OBT-METHOD'/>
                    <TableCol text='LOCATION' key='LOCATION'/>
                    <TableCol text='DESC' key='DESC'/>
                    <TableCol text='IMAGE' key='IMAGE'/>
                    <TableCol text='EDIT' key='EDIT'/>
                    <TableCol text='DELETE' key='DELETE'/>
                  </TableRow>
                </thead>
                <tbody className='font-Josefin align-middle'>
                  {products.map(item => (
                    <TableRow key={item.sku}>            
                      <TableCol text={item.sku} key={`sku-${item.sku}`}/>
                      <TableCol text={item.name} key={`name-${item.sku}`}/>
                      <TableCol text={item.condition} key={`cond-${item.sku}`}/>
                      <TableCol text={item.category.category_name} key={`cat-${item.sku}`}/>
                      <TableCol text={item.obtained_method} key={`ob_me-${item.sku}`}/>
                      <TableCol text={item.location || "Colombia"} key={`location-${item.sku}`}/>
                      <TableCol text={item.description} key={`desc-${item.sku}`}/>
                      <TableCol key={`image-${item.sku}`}>
                        <div onClick={() => modalHandler(item.product_id, item.name)} className='text-secondaryBlue font-bold cursor-pointer'>
                          Image
                        </div>
                      </TableCol>
                      <TableCol key={`edit-${item.sku}`}>
                        <Link className='text-secondaryBlue font-bold' to={`/edit-product/${item.product_id}`}>
                          Edit
                        </Link>
                      </TableCol>
                      <TableCol key={`delete-${item.sku}`}>
                        <div 
                          className='text-mainRed font-bold cursor-pointer'
                          onClick={() => showDeleteConfirmation(item.product_id, item.name)}
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
  );
};

export default Inventory;