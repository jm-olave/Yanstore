import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TableRow from '../Components/TableRow/TableRow';
import TableCol from '../Components/TableCol/TableCol';
import ModalImage from '../Components/ModalImage/ModalImage';
import DeleteItemModal from '../Components/DeleteItemModal/DeleteItemModal';
import InputSelect from '../Components/SelectInput/InputSelect';
import useApi from '../hooks/useApi';
import Caret from '../Components/Caret/Caret';

const ITEMS_PER_PAGE = 30;

const Inventory = () => {

  const tableHeaders = [
    'SKU',
    'NAME',
    'CONDITION',
    'CATEGORY',
    'BASE COST',
    'SHIPMENT COST',
    'OBT METHOD',
    'LOCATION',
    'DESCRIPTION',
  ]

  const { loading: apiLoading, error: apiError, getProducts, getCategories, deleteProduct } = useApi();
  
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products to use for filtering
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const loading = apiLoading;
  const [sort, setSort] = useState({ keyToSort: 'SKU', direction: 'asc' })
  
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'Colombia', label: 'Colombia' },
    { value: 'USA', label: 'USA' }
  ];

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

  // Load products and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get all categories
        const categoriesData = await getCategories();
        const mappedCategories = [
          { value: 'all', label: 'All Categories' },
          ...categoriesData.map(cat => ({
            value: cat.category_id.toString(),
            label: cat.category_name
          }))
        ];
        setCategories(mappedCategories);
        
        // Get all products
        const productsData = await getProducts();
        console.log('Initial products loaded:', productsData.length);
        
        // For each product, fetch the current price point
        const productsWithPricing = await Promise.all(productsData.map(async (product) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/products/${product.product_id}/price-points/?current_only=true&limit=1`);
            if (response.ok) {
              const pricePoints = await response.json();
              if (pricePoints && pricePoints.length > 0) {
                return {
                  ...product,
                  base_cost: pricePoints[0].base_cost,
                  selling_price: pricePoints[0].selling_price,
                  shipment_cost: pricePoints[0].shipment_cost || 0
                };
              }
            }
            // If we can't get price point, return the product without pricing
            return {
              ...product,
              base_cost: null,
              selling_price: null,
              shipment_cost: null
            };
          } catch (error) {
            console.error(`Error fetching price for product ${product.product_id}:`, error);
            // Return the product without pricing instead of filtering it out
            return {
              ...product,
              base_cost: null,
              selling_price: null,
              shipment_cost: null
            };
          }
        }));
        
        console.log('Products with pricing:', productsWithPricing.length);
        setAllProducts(productsWithPricing);
        setProducts(productsWithPricing); // Initially show all products
        setSubmitStatus({ type: '', message: '' });
      } catch (error) {
        console.error('Error loading data:', error);
        setSubmitStatus({
          type: 'error',
          message: `Failed to load data: ${error.message}`
        });
      }
    };

    loadData();
  }, [getProducts, getCategories]);

  // Filter products when category or location changes
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    filterProducts(categoryId, selectedLocation);
  };

  const handleLocationChange = (e) => {
    const location = e.target.value;
    setSelectedLocation(location);
    filterProducts(selectedCategory, location);
  };

  const filterProducts = (categoryId, location) => {
    let filteredProducts = allProducts;

    // Apply category filter
    if (categoryId !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.category_id.toString() === categoryId
      );
    }

    // Apply location filter
    if (location !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.location === location
      );
    }

    setProducts(filteredProducts);
  };

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
      
      // Remove the product from both states
      const updatedProducts = allProducts.filter(product => product.product_id !== productId);
      setAllProducts(updatedProducts);
      
      // Update filtered products based on current category
      if (selectedCategory === 'all') {
        setProducts(updatedProducts);
      } else {
        setProducts(updatedProducts.filter(product => 
          product.category_id.toString() === selectedCategory
        ));
      }
      
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

  // Format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '-';
    return `$${parseFloat(value).toFixed(2)}`;
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

  // Sort Functionality
  const handleSortClick = (header) => {
    setSort({
      keyToSort: header,
      direction: 
        header === sort.keyToSort ? sort.direction === 'asc' ? 'desc' : 'asc' : 'desc'
    })
  }

  const getSortedArray = (arrayToSort) => {
    if (sort.direction === 'asc') {
      return arrayToSort.sort((a, b) => (a[sort.keyToSort.toLocaleLowerCase()] > b[sort.keyToSort.toLocaleLowerCase()] ? 1 : -1))
    } else {
      return arrayToSort.sort((a, b) => (a[sort.keyToSort.toLocaleLowerCase()] > b[sort.keyToSort.toLocaleLowerCase()] ? -1 : 1))
    }
  }

  // Calculate paginated products
  const getPaginatedProducts = (products) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  };

  // Update total pages when products change
  useEffect(() => {
    const newTotalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    console.log('Products length:', products.length);
    console.log('Total pages:', newTotalPages);
    setTotalPages(newTotalPages);
    // Reset to first page when products change
    setCurrentPage(1);
  }, [products]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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
        
        {/* Category and Location Filters */}
        <div className="w-11/12 mx-auto max-w-7xl mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="max-w-96">
              <InputSelect 
                name="categoryFilter"
                title="Category"
                value={selectedCategory}
                options={categories}
                onChange={handleCategoryChange}
              />
            </div>
            <div className="max-w-96">
              <InputSelect 
                name="locationFilter"
                title="Location"
                value={selectedLocation}
                options={locations}
                onChange={handleLocationChange}
              />
            </div>
            <div className="flex justify-end items-center">
              <div className="text-secondaryBlue font-semibold">
                {products.length} products found
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Loading inventory data...</p>
          </div>
        ) : (
          <section className='w-11/12 mx-auto max-w-screen-2xl'>
            <div className='overflow-x-auto relative'>
              <table className='w-full min-w-[800px]'>
                <thead className='font-Mulish font-black text-secondaryBlue'>
                  <TableRow>
                    {tableHeaders.map(header => (
                      <TableCol text={header} key={header} onClick={() => handleSortClick(header)} className='cursor-pointer'>
                        <div className='w-full h-full flex justify-between items-center gap-3'>
                          {header}
                          {header === sort.keyToSort && (
                            <Caret className={sort.keyToSort === header ? sort.direction === 'asc' ? 'rotate-0' : 'rotate-180' : 'rotate-180'}/>
                          )}
                        </div>
                      </TableCol>
                    ))}
                    <TableCol text='IMAGE' key='IMAGE'/>
                    <TableCol text='EDIT' key='EDIT'/>
                    <TableCol text='DELETE' key='DELETE'/>
                  </TableRow>
                </thead>
                <tbody className='font-Josefin align-middle'>
                  {products.length > 0 ? (
                    getSortedArray(getPaginatedProducts(products)).map(item => (
                      <TableRow key={item.sku}>            
                        <TableCol text={item.sku} key={`sku-${item.sku}`}/>
                        <TableCol text={item.name} key={`name-${item.sku}`}/>
                        <TableCol text={item.condition} key={`cond-${item.sku}`}/>
                        <TableCol text={item.category?.category_name || 'Unknown'} key={`cat-${item.sku}`}/>
                        <TableCol text={item.base_cost ? `$${Number(item.base_cost).toFixed(2)}` : 'N/A'} key={`cost-${item.sku}`}/>
                        <TableCol text={formatCurrency(item.shipment_cost)} key={`shipment-cost-${item.sku}`}/>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCol colSpan="13" className="text-center py-4">
                        <div>No products found in this category.</div>
                      </TableCol>
                    </TableRow>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-secondaryBlue text-white hover:bg-blue-700'
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === page
                        ? 'bg-secondaryBlue text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-secondaryBlue text-white hover:bg-blue-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
};

export default Inventory;