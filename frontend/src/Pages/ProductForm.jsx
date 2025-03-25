import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import InputSelect from '../Components/SelectInput/InputSelect'
import TextInput from '../Components/TextInput/TextInput'
import DateInput from '../Components/DateInput/DateInput'
import ImageInput from '../Components/ImageInput/ImageInput'
import TextAreaInput from '../Components/TextAreaInput/TextAreaInput'
import NumberInput from '../Components/NumberInput/NumberInput'
import SubmitButton from '../Components/SubmitButton/SubmitButton'
import useApi from '../hooks/useApi'
import useDateUtils from '../hooks/useDate'
import GradientButton from '../Components/GradientButton/GradientButton'

const obtainingMethods = [
  { value: 'Select Option', label: 'Select Option' },
  { value: 'audit', label: 'Audit' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'trade', label: 'Trade' },
]

const conditions = [
  { value: 'Select Option', label: 'Select Option' },
  { value: 'New', label: 'New' },
  { value: 'Used', label: 'Used' },
  { value: 'Damaged', label: 'Damaged' },
]

const cardConditions = [
  { value: 'Select Option', label: 'Select Option' },
  { value: 'Mint', label: 'Mint' },
  { value: 'Near Mint', label: 'Near Mint' },
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Good', label: 'Good' },
  { value: 'Lightly Played', label: 'Lightly Played' },
  { value: 'Played', label: 'Played' },
  { value: 'Poor', label: 'Poor' },
]

const locations = [
  { value: 'Select Option', label: 'Select Option' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'USA', label: 'USA' },
]

const ProductForm = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(productId)

  // Use the API hook
  const { 
    loading: apiLoading, 
    error: apiError, 
    getProduct, 
    getCategories, 
    createProduct, 
    updateProduct,
    createPricePoint
  } = useApi()

  // Use the date utils hook
  const { formatForApi, formatForDisplay } = useDateUtils()

  // Get current date in YYYY-MM-DD format for max date attribute
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: '',
    category_id: 'Select Option',
    condition: 'Select Option',
    obtained_method: 'Select Option',
    purchase_date: '',
    location: 'Select Option',
    image: null,
    description: '',
    initial_quantity: 1,
    base_cost: '',
    selling_price: '',
    shipment_cost: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })
  const [categories, setCategories] = useState([
    { value: 'Select Option', label: 'Select Option' }
  ])

  // Fetch product data if in edit mode
  useEffect(() => {
    const fetchProductData = async () => {
      if (!isEditMode) return

      try {
        setIsSubmitting(true)
        const productData = await getProduct(productId)
        
        // Format the date using our hook
        const formattedDate = formatForDisplay(productData.purchase_date)
        
        // Fetch the latest price point for this product
        let baseCost = '';
        let sellingPrice = '';
        let shipmentCost = '';

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/products/${productId}/price-points/?current_only=true&limit=1`);
          if (response.ok) {
            const pricePoints = await response.json();
            if (pricePoints && pricePoints.length > 0) {
              sellingPrice = pricePoints[0].selling_price.toString();
              shipmentCost = pricePoints[0].shipment_cost ? pricePoints[0].shipment_cost.toString() : '0.00';
            }
          }
        } catch (priceError) {
          console.error('Error fetching price points:', priceError);
        }

        setForm({
          name: productData.name,
          category_id: productData.category_id.toString(),
          condition: productData.condition,
          obtained_method: productData.obtained_method,
          purchase_date: formattedDate,
          location: productData.location || 'Select Option',
          description: productData.description || '',
          image: null, // We don't load the existing image as it can't be displayed in the file input
          initial_quantity: 1,
          base_cost: baseCost,
          selling_price: sellingPrice,
          shipment_cost: shipmentCost
        })
      } catch (error) {
        setSubmitStatus({
          type: 'error',
          message: `Failed to load product: ${error.message}`
        })
        console.error('Error fetching product:', error)
      } finally {
        setIsSubmitting(false)
      }
    }

    fetchProductData()
  }, [productId, isEditMode, getProduct, formatForDisplay])

  // Display API errors from the hook
  useEffect(() => {
    if (apiError) {
      setSubmitStatus({
        type: 'error',
        message: apiError
      })
    }
  }, [apiError])

  const validateForm = () => {
    if (!form.name.trim()) {
      setSubmitStatus({ type: 'error', message: 'Name is required' })
      return false
    }
    if (form.category_id === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select a category' })
      return false
    }
    if (form.condition === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select a condition' })
      return false
    }
    if (form.obtained_method === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select an obtaining method' })
      return false
    }
    if (form.location === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select a location' })
      return false
    }
    if (!form.purchase_date) {
      setSubmitStatus({ type: 'error', message: 'Purchase date is required' })
      return false
    }
    
    // Validate base cost
    if (!form.base_cost || parseFloat(form.base_cost) <= 0) {
      setSubmitStatus({ type: 'error', message: 'Base cost is required and must be greater than 0' })
      return false
    }
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) {
      setSubmitStatus({ type: 'error', message: 'Selling price is required and must be greater than 0' })
      return false
    }
    if (form.shipment_cost && parseFloat(form.shipment_cost) < 0) {
      setSubmitStatus({ type: 'error', message: 'Shipment cost cannot be negative' })
      return false
    }
    
    // Additional validation to ensure the date is not in the future
    const selectedDate = new Date(form.purchase_date)
    const currentDate = new Date()
    
    if (selectedDate > currentDate) {
      setSubmitStatus({ type: 'error', message: 'Purchase date cannot be in the future' })
      return false
    }
    
    return true
  }

  const submitForm = async () => {
    try {
      setIsSubmitting(true)
      setSubmitStatus({ type: '', message: '' })

      const categoryId = parseInt(form.category_id, 10)
      if (isNaN(categoryId)) {
        throw new Error('Invalid category ID')
      }

      const dateValue = formatForApi(form.purchase_date)

      if (isEditMode) {
        const updateData = {
          name: form.name,
          category_id: categoryId,
          condition: form.condition,
          obtained_method: form.obtained_method.toLowerCase(),
          location: form.location,
          purchase_date: dateValue,
          description: form.description
        }
        
        console.log('Updating product with data:', updateData);
        await updateProduct(productId, updateData)
        
        // Check if the price information has been provided and create a new price point
        if (form.base_cost) {
          try {
            await createPricePoint({
              product_id: parseInt(productId),
              base_cost: parseFloat(form.base_cost),
              selling_price: parseFloat(form.selling_price), // Set a default selling price as 30% markup
              market_price: parseFloat(form.base_cost) * 1.3,
              shipment_cost: parseFloat(form.shipment_cost), // Set market price same as selling price by default
              currency: 'USD',
              effective_from: new Date().toISOString()
            });
            console.log('Created new price point for updated product');
          } catch (priceError) {
            console.error('Error creating price point:', priceError);
            // We'll continue even if price point creation fails
          }
        }
        
        setSubmitStatus({ 
          type: 'success', 
          message: 'Product successfully updated!' 
        })
      } else {
        // Create new product using the hook
        const formData = new FormData()
        
        // Add all required fields
        formData.append('name', form.name)
        formData.append('category_id', categoryId)
        formData.append('condition', form.condition)
        formData.append('obtained_method', form.obtained_method.toLowerCase())
        formData.append('purchase_date', dateValue)
        
        // Add optional fields
        if (form.location && form.location !== 'Select Option') {
          formData.append('location', form.location)
        }
        
        if (form.description) {
          formData.append('description', form.description)
        }
        
        formData.append('initial_quantity', form.initial_quantity || 1)
        
        if (form.image) {
          formData.append('image', form.image)
        }
        
        const newProduct = await createProduct(formData)  
        
        // Create a price point for the new product
        await createPricePoint({
          product_id: newProduct.product_id,
          base_cost: parseFloat(form.base_cost),
          selling_price: parseFloat(form.selling_price), // Set a default selling price as 30% markup
          market_price: parseFloat(form.base_cost) * 1.3,
          shipment_cost: parseFloat(form.shipment_cost), 
          currency: 'USD',
          effective_from: new Date().toISOString()
        })
        
        setSubmitStatus({ 
          type: 'success', 
          message: 'Product and pricing successfully added!' 
        })

        // Reset form after successful submission (only in create mode)
        setForm({
          name: '',
          category_id: 'Select Option',
          condition: 'Select Option',
          obtained_method: 'Select Option',
          purchase_date: '',
          location: 'Select Option',
          image: null,
          description: '',
          initial_quantity: 1,
          base_cost: '',
          selling_price: '',
          shipment_cost: ''
        })
      }

    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to ${isEditMode ? 'update' : 'submit'} form: ${error.message}` 
      })
      console.error('API Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target
    
    if (type === 'file' && files) {
      setForm(prev => ({
        ...prev,
        [name]: files[0]
      }))
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (validateForm()) {
      await submitForm()
    }
  }

  // Fetch categories using the API hook
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories()
        
        const mappedCategories = [
          { value: 'Select Option', label: 'Select Option' },
          ...data.map(cat => ({
            value: cat.category_id.toString(),
            label: cat.category_name
          }))
        ]
        setCategories(mappedCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    
    fetchCategories()
  }, [getCategories])

  return (
    <div className="w-11/12 pb-11 mx-auto lg:max-w-5xl">
      {submitStatus.message && (
        <div className={`mb-4 p-4 rounded-md ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {submitStatus.message}
        </div>
      )}

      <form className='lg:grid lg:grid-cols-2 lg:gap-4' onSubmit={handleSubmit}>
        <div className='flex flex-col justify-evenly'>
          <TextInput 
            name='name' 
            title='Name'
            placeholder='Name'
            value={form.name} 
            onChange={handleFormChange}
            required
          />
          <InputSelect 
            name='category_id'
            title='Categories' 
            value={form.category_id} 
            options={categories} 
            onChange={handleFormChange}
            required
          />
          <InputSelect 
            name='condition' 
            title='Condition' 
            value={form.condition} 
            options={form.category_id === '4' ? cardConditions : conditions} 
            onChange={handleFormChange}
            required
          />

          <InputSelect 
            name='location' 
            title='Location' 
            value={form.location} 
            options={locations} 
            onChange={handleFormChange}
            required
          />
        </div>

        <div className='flex flex-col'>
          <InputSelect 
            name='obtained_method'
            title='Obtaining Method' 
            value={form.obtained_method} 
            options={obtainingMethods} 
            onChange={handleFormChange}
            required
          />
          <DateInput 
            name='purchase_date'
            title='Purchase Date' 
            value={form.purchase_date} 
            onChange={(e) => {
              handleFormChange({
                target: {
                  name: 'purchase_date',
                  value: e.target.value
                }
              })
            }}
            max={today}
            required
          />

          {!isEditMode && (
            <ImageInput 
              name='image' 
              title='Image' 
              onChange={handleFormChange}
            />
          )}
        </div>
        {/* Financial information section */}
        <div className='lg:col-span-2 mt-4'>
          <h3 className="text-lg font-semibold text-secondaryBlue mb-3">Financial Information</h3>
          <div className='lg:grid lg:grid-cols-3 lg:gap-4'>
            <NumberInput 
              name='base_cost'
              title='Base Cost'
              value={form.base_cost}
              onChange={handleFormChange}
              required
            />
            <NumberInput 
              name='selling_price'
              title='Selling Price'
              value={form.selling_price}
              onChange={handleFormChange}
              required
            />
            <NumberInput 
              name='shipment_cost'
              title='Shipment Cost'
              value={form.shipment_cost}
              onChange={handleFormChange}
            />
          </div>
        </div>
        
        
        <div className='lg:col-span-2'>
          <TextAreaInput 
            name='description' 
            title='Notes'
            placeholder='Notes'
            value={form.description} 
            onChange={handleFormChange}
          />
        </div>

        <div className='w-full max-w-xs mx-auto lg:col-start-2 lg:m-0 lg:justify-self-end lg:max-w-md'>
          <div className='flex w-full flex-col gap-3 lg:flex-row'>
            <SubmitButton 
              text={isSubmitting || apiLoading ? 'SUBMITTING...' : isEditMode ? 'UPDATE PRODUCT' : 'ADD PRODUCT'} 
              type="submit"
              disabled={isSubmitting || apiLoading}
            />

            <button className='w-full p-3 font-Mulish font-black text-white text-xl border bg-gradient-radial from-secondaryBlue to-mainBlue md:max-w-15 lg:max-w-sm'>
              <Link to='/inventory'>
                Go to Inventory
              </Link>
            </button>
          </div>
          
        </div>
      </form>
    </div>
  )
}

export default ProductForm