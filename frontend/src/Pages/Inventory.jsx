import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { Link } from 'react-router-dom';
import TableRow from '../Components/TableRow/TableRow';
import TableCol from '../Components/TableCol/TableCol';
import ModalImage from '../Components/ModalImage/ModalImage';
import DeleteItemModal from '../Components/DeleteItemModal/DeleteItemModal';
import InputSelect from '../Components/SelectInput/InputSelect';
import useApi from '../hooks/useApi';
import Caret from '../Components/Caret/Caret';
import SellModal from '../Components/SellModal/SellModal';
import TextInput from '../Components/TextInput/TextInput';
import MigrationButton from '../Components/MigrationButton/MigrationButton';

const ITEMS_PER_PAGE = 90;

const Inventory = () => {

  const [selectedInstanceIds, setSelectedInstanceIds] = useState([]);

  const tableHeaders = [
    '', // For select all checkbox
    'SKU',
    'NAME',
    'CONDITION',
    'CATEGORY',
    'BASE COST',
    'LOCATION',
    'DESCRIPTION'
  ];

  const { loading: apiLoading, error: apiError, getInstances, getCategories, deleteProduct, bulkUpdateProductLocation } = useApi();
  
  const [allInstances, setAllInstances] = useState([]); // Store all fetched instances
  const [displayedInstances, setDisplayedInstances] = useState([]); // Instances currently shown after all filters
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [sort, setSort] = useState({ keyToSort: 'SKU', direction: 'asc' });
  
  const [modalData, setModalData] = useState({
    open: false,
    img: '',
    caption: '',
    productId: null
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,  
    item: {},
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'Colombia', label: 'Colombia' },
    { value: 'USA', label: 'USA' }
  ];

  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [saleData, setSaleData] = useState({
    sale_price: '',
    payment_method: '',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [nameToSearch, setNameToSearch] = useState(""); // Renamed for clarity

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState('');

  // This is the CORRECT and ONLY definition of getPaginatedProducts
  const getPaginatedInstances = (instancesToPaginate) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return instancesToPaginate.slice(startIndex, endIndex);
  };

  // For Select All Checkbox on current page
  const currentPagedInstances = getPaginatedInstances(displayedInstances);
  const allOnPageSelected = currentPagedInstances.length > 0 && currentPagedInstances.every(p => selectedInstanceIds.includes(p.instance_id));

  const handleSelectAllOnPage = () => {
    if (allOnPageSelected) {
      // Deselect all on current page
      const pageInstanceIds = currentPagedInstances.map(p => p.instance_id);
      setSelectedInstanceIds(prevSelected => prevSelected.filter(id => !pageInstanceIds.includes(id)));
    } else {
      // Select all on current page
      const pageInstanceIds = currentPagedInstances.map(p => p.instance_id);
      setSelectedInstanceIds(prevSelected => [...new Set([...prevSelected, ...pageInstanceIds])]);
    }
  };

  const handleSelectSingle = (instanceId, isSelected) => {
    if (isSelected) {
      setSelectedInstanceIds(prevSelected => prevSelected.filter(id => id !== instanceId));
    } else {
      setSelectedInstanceIds(prevSelected => [...prevSelected, instanceId]);
    }
  };

  const PAYMENT_METHODS = [
    { value: "Select Option", label: "Select Option" },
    { value: 'Credit', label: 'Credit' },
    { value: 'Cash', label: 'Cash' },
    { value: 'USD', label: 'USD' },
    { value: 'Trade', label: 'Trade' },
  ];

  const filteredLocation = locations.filter(loc => loc.value !== 'all'); // For the modal select
  const modalLocation = [
    { value: "Select Option", label: "Select Option" },
    ...filteredLocation
  ]

  const handleBulkLocationUpdate = async () => {
    console.log('handleBulkLocationUpdate triggered. newLocation:', newLocation);
    console.log('newLocation type:', typeof newLocation);
    console.log('newLocation length:', newLocation?.length);
    console.log('newLocation === "all":', newLocation === 'all');
    console.log('!newLocation:', !newLocation);
    
    // More robust validation
    if (!newLocation || newLocation.trim() === '' || newLocation === 'all') {
      console.log('Validation failed - invalid location selection');
      setSubmitStatus({ type: 'error', message: 'Please select a valid new location.' });
      return;
    }
  
    // Additional validation to ensure we have selected products
    if (!selectedInstanceIds || selectedInstanceIds.length === 0) {
      console.log('Validation failed - no products selected');
      setSubmitStatus({ type: 'error', message: 'Please select at least one product to update.' });
      return;
    }
  
    try {
      console.log('selectedInstanceIds:', selectedInstanceIds); 
      const integerInstanceIds = selectedInstanceIds.map(id => parseInt(id, 10));
      console.log('integerInstanceIds:', integerInstanceIds);
      console.log('Attempting to update with newLocation:', newLocation);
      console.log('About to call bulkUpdateProductLocation...');
      
      const result = await bulkUpdateProductLocation(integerInstanceIds, newLocation);
      console.log('bulkUpdateProductLocation result:', result);
      
      if (result.updated_count > 0 || result.message) {
        setSubmitStatus({ 
          type: 'success', 
          message: result.message || `${result.updated_count} products updated successfully.` 
        });
        fetchInstances(); // Refresh products
        setSelectedInstanceIds([]); // Clear selections
        setIsLocationModalOpen(false); // Close modal
        setNewLocation(''); // Reset new location
      } else if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map(err => `Product ID ${err.product_id}: ${err.error}`).join('; ');
        setSubmitStatus({ 
          type: 'error', 
          message: `Update failed for some products: ${errorMessages}` 
        });
      } else {
        // Fallback for unexpected success response structure
        setSubmitStatus({ 
          type: 'success', 
          message: 'Bulk update process completed.' 
        });
      }
    } catch (error) {
      console.error('Error bulk updating product locations:', error);
      console.error('Error details:', error.message, error.stack);
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to update locations: ${error.message}` 
      });
    }
  };
  
  // Also add this debugging function to check the InputSelect onChange
  const handleLocationSelectChange = (e) => {
    console.log('InputSelect onChange triggered');
    console.log('e.target.value:', e.target.value);
    console.log('e.target.value type:', typeof e.target.value);

    if (e.target.value === "Select Option") {
      setSubmitStatus({ type: 'error', message: 'Select a valid location' });
    } else {
      setNewLocation(e.target.value);
    }
    console.log('After setNewLocation - newLocation should be:', e.target.value);
    console.log('=== END InputSelect DEBUG ===');
  };

  const handleSell = async () => {
    try {
      if (!saleData.sale_price) {
        setSubmitStatus({ type: 'error', message: 'Sale price is required' });
        return;
      }
      if (!saleData.payment_method) {
        setSubmitStatus({ type: 'error', message: 'Payment method is required' });
        return;
      }
      if (!saleData.sale_date) {
        setSubmitStatus({ type: 'error', message: 'Sale date is required' });
        return;
      }

      const saleDate = new Date(saleData.sale_date);
      saleDate.setHours(12, 0, 0, 0);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/instances/${selectedInstance.instance_id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...saleData, sale_date: saleDate.toISOString() }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchInstances(); // Re-fetch products to update inventory
        setSellModalOpen(false);
        setSaleData({ sale_price: '', payment_method: '', sale_date: new Date().toISOString().split('T')[0], notes: '' });
        setSubmitStatus({ type: 'success', message: 'Product sold successfully' });
      } else {
        const errorMessage = data.detail || 'Unknown error occurred';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: `Failed to sell product: ${error.message}` });
      console.error('Error selling product:', error);
    }
  };

  const modalHandler = (productId, productName) => {
    if (modalData.open === false && productId) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000';
      const imageUrl = `${baseUrl}/products/${productId}/image`;
      setModalData({ open: true, img: imageUrl, caption: productName || 'Product Image', productId: productId });
    } else {
      setModalData({ open: false, img: '', caption: '', productId: null });
    }
  };

  const fetchInstances = async () => {
    setInventoryLoading(true);
    try {
      const instances = await getInstances();
      setAllInstances(instances);
      setSubmitStatus({ type: '', message: '' });
    } catch (error) {
      console.error('Error loading data:', error);
      setSubmitStatus({ type: 'error', message: `Failed to load data: ${error.message}` });
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesData = await getCategories();
        const mappedCategories = [
          { value: 'all', label: 'All Categories' },
          ...categoriesData.map(cat => ({ value: cat.category_id.toString(), label: cat.category_name }))
        ];
        setCategories(mappedCategories);
        await fetchInstances();
      } catch (error) {
        console.error('Error loading data:', error);
        setSubmitStatus({ type: 'error', message: `Failed to load data: ${error.message}` });
        setInventoryLoading(false);
      }
    };
    loadData();
  }, [getInstances, getCategories]);

  // Combined filter function using useCallback for memoization
  const applyFilters = useCallback(() => {
    let currentFilteredInstances = [...allInstances]; // Start with all instances

    // Apply name search filter
    if (nameToSearch.trim() !== '') { //
      const lowerCaseSearchText = nameToSearch.toLowerCase(); //
      currentFilteredInstances = currentFilteredInstances.filter(item => //
        item.product.name && typeof item.product.name === 'string' && item.product.name.toLowerCase().includes(lowerCaseSearchText) //
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') { //
      currentFilteredInstances = currentFilteredInstances.filter(instance =>  //
        instance.product.category_id?.toString() === selectedCategory //
      );
    }

    // Apply location filter
    if (selectedLocation !== 'all') { //
      currentFilteredInstances = currentFilteredInstances.filter(instance => //
        instance.location === selectedLocation //
      );
    }

    setDisplayedInstances(currentFilteredInstances); // Update the instances to be displayed
  }, [allInstances, nameToSearch, selectedCategory, selectedLocation]); // Dependencies for memoization

  // Run applyFilters whenever filter dependencies change
  useEffect(() => {
    applyFilters();
  }, [allInstances, nameToSearch, selectedCategory, selectedLocation, applyFilters]); //


  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  const showDeleteConfirmation = (item) => {
    setDeleteConfirmation({ show: true, item: {...item} });
  };

  const hideDeleteConfirmation = () => {
    setDeleteConfirmation({ show: false, item: {} });
  };

  const handleDeleteProduct = async () => {
    try {
      const productId = deleteConfirmation.item.product_id;
      if (!productId) return;
      
      const result = await deleteProduct(productId);
      
      // Update allInstances directly after deletion
      setAllInstances(prevInstances => prevInstances.filter(instance => instance.product.product_id !== productId));
      
      setSubmitStatus({ type: 'success', message: result.message || 'Product successfully deleted' });
      hideDeleteConfirmation();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      setSubmitStatus({ type: 'error', message: `Failed to delete product: ${error.message}` });
      hideDeleteConfirmation();
    }
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '-';
    return `$${parseFloat(value).toFixed(2)}`;
  };
  
  useEffect(() => {
    if (apiError) {
      setSubmitStatus({ type: 'error', message: apiError });
    }
  }, [apiError]);

  const handleSortClick = (header) => {
    setSort({
      keyToSort: header,
      direction: header === sort.keyToSort ? (sort.direction === 'asc' ? 'desc' : 'asc') : 'desc'
    });
  };

  const getSortedArray = (arrayToSort) => {
    if (!arrayToSort || arrayToSort.length === 0) return [];
    
    // Create a shallow copy to avoid modifying the original array during sort
    const sortableArray = [...arrayToSort]; 

    return sortableArray.sort((a, b) => {
      const aValue = a[sort.keyToSort.toLocaleLowerCase()];
      const bValue = b[sort.keyToSort.toLocaleLowerCase()];

      if (aValue === null || aValue === undefined) return sort.direction === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sort.direction === 'asc' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      return 0;
    });
  };


  const handleNameSearch = (e) => {
    setNameToSearch(e.target.value);
  };

  useEffect(() => {
    const newTotalPages = Math.ceil(displayedInstances.length / ITEMS_PER_PAGE); // Use displayedInstances here
    setTotalPages(newTotalPages);
    setCurrentPage(1);
  }, [displayedInstances]); // Recalculate total pages when displayed products change

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      <ModalImage data={modalData} handler={modalHandler} />

      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Update Location for Selected Products</h2>
            <p className="mb-4 text-sm text-gray-700">
              You have selected {selectedInstanceIds.length} product(s).
            </p>
            <InputSelect
              name="newLocation"
              title="New Location"
              value={newLocation}
              options={modalLocation} // Use filtered locations without "All Locations"
              onChange={handleLocationSelectChange}
              className="mb-4"
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setIsLocationModalOpen(false);
                  setNewLocation(''); // Reset location on cancel
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkLocationUpdate}
                disabled={!newLocation || newLocation === 'all' || apiLoading} // Disable if no location selected or loading
                className="px-4 py-2 bg-secondaryBlue text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {apiLoading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {deleteConfirmation.show && (
        <DeleteItemModal 
          deleteConfirmation={deleteConfirmation} 
          hideDeleteConfirmation={hideDeleteConfirmation} 
          handleDeleteFunction={handleDeleteProduct}
          headers={["SKU", "NAME", "CONDITION", "CATEGORY"]}
        />
      )}
      
      {sellModalOpen && selectedInstance && (
        <SellModal 
          PAYMENT_METHODS={PAYMENT_METHODS}
          selectedProduct={selectedInstance}
          setSaleData={setSaleData}
          saleData={saleData}
          handleSell={handleSell}
          setSellModalOpen={setSellModalOpen}
        />
      )}

      <div className="w-full overflow-x-hidden">
        {submitStatus.message && (
          <div className={`mb-4 p-4 rounded-md ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {submitStatus.message}
          </div>
        )}
        
        <div className="w-11/12 mx-auto max-w-7xl mb-6">
          <div className="grid md:grid-cols-3 md:grid-rows-2 gap-4">
            <div className="max-w-96">
              <TextInput
                name="productName"
                title="Product Name"
                value={nameToSearch} // Use nameToSearch state
                onChange={handleNameSearch}
                placeholder='Name'
              />
            </div>
            <div className="row-start-2 max-w-96">
              <InputSelect 
                name="categoryFilter"
                title="Category"
                value={selectedCategory}
                options={categories}
                onChange={handleCategoryChange}
              />
            </div>
            <div className="row-start-2 max-w-96">
              <InputSelect 
                name="locationFilter"
                title="Location"
                value={selectedLocation}
                options={locations}
                onChange={handleLocationChange}
              />
            </div>
            <div className='flex justify-center items-center col-start-3'>
              <div className="text-secondaryBlue font-semibold">
                {displayedInstances.length} products found
              </div>
            </div>
            <div className="flex justify-center items-center row-start-2 gap-4">
              <Link 
                to="/statistics" 
                className="bg-secondaryBlue text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                View Statistics
              </Link>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                disabled={selectedInstanceIds.length === 0}
                className="bg-secondaryBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:cursor-not-allowed"
              >
                Edit Selected Locations ({selectedInstanceIds.length})
              </button>
            </div>
            
            {/* Migration Button - Only show if no instances exist */}
            {displayedInstances.length === 0 && !inventoryLoading && (
              <div className="col-span-3 flex justify-center mt-4">
                <MigrationButton />
              </div>
            )}
          </div>
        </div>
        
        {inventoryLoading ? ( 
          <div className="text-center py-8">
            <p>Loading inventory data...</p>
          </div>
        ) : (
          <section className='w-11/12 mx-auto max-w-screen-2xl'>
            <div className='overflow-x-auto relative h-full'>
              <table className='w-full min-w-[800px]'>
                <thead className='font-Mulish font-black text-secondaryBlue'>
                  <TableRow>
                    <TableCol key="select-all-header">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-blue-600"
                        checked={allOnPageSelected}
                        onChange={handleSelectAllOnPage}
                        disabled={currentPagedInstances.length === 0} // Disable if no products on page
                      />
                    </TableCol>
                    {tableHeaders.slice(1).map(header => ( // Use slice(1) to skip the manually added first header for checkbox
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
                    <TableCol text='SELL' key='SELL'/>
                  </TableRow>
                </thead>
                <tbody className='font-Josefin align-middle'>
                  {displayedInstances.length > 0 ? ( 
                    getSortedArray(getPaginatedInstances(displayedInstances)).map(item => {
                      const isSelected = selectedInstanceIds.includes(item.instance_id);
                      return (
                      <TableRow key={item.instance_id}>
                        <TableCol key={`select-${item.instance_id}`}>
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={isSelected}
                            onChange={() => handleSelectSingle(item.instance_id, isSelected)}
                          />
                        </TableCol>
                        <TableCol text={item.product.sku} key={`sku-${item.instance_id}`}/>
                        <TableCol text={item.product.name} key={`name-${item.instance_id}`}/>
                        <TableCol text={item.product.condition} key={`cond-${item.instance_id}`}/>
                        <TableCol 
                          text={categories.find(cat => cat.value === item.product.category_id?.toString())?.label || 'Unknown'} 
                          key={`cat-${item.instance_id}`}
                        />
                        <TableCol text={item.base_cost ? `${Number(item.base_cost).toFixed(2)}` : 'N/A'} key={`cost-${item.instance_id}`}/>
                        <TableCol text={item.location || "Colombia"} key={`location-${item.instance_id}`}/>
                        <TableCol text={item.product.description} key={`desc-${item.instance_id}`}/>
                        <TableCol key={`image-${item.instance_id}`}>
                          <div onClick={() => modalHandler(item.product.product_id, item.product.name)} className='text-secondaryBlue font-bold cursor-pointer'>
                            Image
                          </div>
                        </TableCol>
                        <TableCol key={`edit-${item.instance_id}`}>
                          <Link className='text-secondaryBlue font-bold' to={`/edit-product/${item.product.product_id}`}>
                            Edit
                          </Link>
                        </TableCol>
                        <TableCol key={`delete-${item.instance_id}`}>
                          <div 
                            className='text-mainRed font-bold cursor-pointer'
                            onClick={() => showDeleteConfirmation(item.product)}
                          >
                            Delete
                          </div>
                        </TableCol>
                        <TableCol>
                          <button
                            onClick={() => {
                              setSelectedInstance(item);
                              setSellModalOpen(true);
                            }}
                            disabled={item.status !== 'available'}
                            className={`text-secondaryBlue px-4 py-2 rounded font-bold ${
                              item.status !== 'available'
                                ? 'bg-gray-300 text-gray-600'
                                : 'bg-green-500 hover:bg-green-600 text-Green'
                            }`}
                          >
                            {item.status !== 'available' ? 'Sold' : 'Sell'}
                          </button>
                        </TableCol>
                      </TableRow>
                    )
                  })
                  ) : (
                    <TableRow>
                      <TableCol colSpan="14" className="text-center py-4"> {/* Adjusted colSpan */}
                        <div>No products found.</div>
                      </TableCol>
                    </TableRow>
                  )}
                </tbody>
              </table>
            </div>

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