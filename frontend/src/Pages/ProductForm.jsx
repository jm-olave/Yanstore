import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import InputSelect from '../Components/SelectInput/InputSelect'
import TextInput from '../Components/TextInput/TextInput'
import DateInput from '../Components/DateInput/DateInput'
import ImageInput from '../Components/ImageInput/ImageInput'
import TextAreaInput from '../Components/TextAreaInput/TextAreaInput'
import SubmitButton from '../Components/SubmitButton/SubmitButton'

// Get API URL from environment variables or use a default
const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

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

  const [form, setForm] = useState({
    name: '',
    category_id: 'Select Option',
    condition: 'Select Option',
    obtained_method: 'Select Option',
    purchase_date: '',
    location: 'Select Option',
    image: null,
    description: '',
    initial_quantity: 1
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
        const response = await fetch(`${apiURL}/products/${productId}`)
        if (!response.ok) throw new Error('Failed to fetch product')
        
        const productData = await response.json()
        
        // Format the date to YYYY-MM-DD for the date input
        const formattedDate = new Date(productData.purchase_date)
          .toISOString()
          .split('T')[0]

        setForm({
          name: productData.name,
          category_id: productData.category_id.toString(),
          condition: productData.condition,
          obtained_method: productData.obtained_method,
          purchase_date: formattedDate,
          location: productData.location || 'Select Option',
          description: productData.description || '',
          image: null, // We don't load the existing image as it can't be displayed in the file input
          initial_quantity: 1
        })
      } catch (error) {
        setSubmitStatus({
          type: 'error',
          message: `Failed to load product: ${error.message}`
        })
        console.error('Error fetching product:', error)
      }
    }

    fetchProductData()
  }, [productId, isEditMode])

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
    return true
  }

  const submitForm = async () => {
    try {
      setIsSubmitting(true)
      setSubmitStatus({ type: '', message: '' })

      const formData = new FormData()
      
      const categoryId = parseInt(form.category_id, 10)
      if (isNaN(categoryId)) {
        throw new Error('Invalid category ID')
      }

      formData.append('name', form.name)
      formData.append('category_id', categoryId)
      formData.append('condition', form.condition)
      formData.append('obtained_method', form.obtained_method.toLowerCase())
      formData.append('location', form.location)
      formData.append('purchase_date', form.purchase_date)
      formData.append('description', form.description || '')
      formData.append('initial_quantity', form.initial_quantity || 1)
      
      if (form.image) {
        formData.append('image', form.image)
      }

      // Log FormData entries for debugging
      console.log('Submitting form with data:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const url = isEditMode 
        ? `${apiURL}/products/${productId}`
        : `${apiURL}/products/`

      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        body: isEditMode 
          ? JSON.stringify({
              name: form.name,
              category_id: categoryId,
              condition: form.condition,
              obtained_method: form.obtained_method.toLowerCase(),
              location: form.location,
              purchase_date: form.purchase_date,
              description: form.description
            })
          : formData,
        headers: isEditMode 
          ? {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          : {
              'Accept': 'application/json'
            }
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          let errorMessage = 'Unknown error occurred';
          
          if (errorData.detail) {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : Array.isArray(errorData.detail)
                ? errorData.detail.map(err => err.msg).join(', ')
                : errorMessage;
          }
          
          throw new Error(errorMessage);
        } catch (jsonError) {
          throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
        }
      }

      const productData = await response.json()
      setSubmitStatus({ 
        type: 'success', 
        message: `Product successfully ${isEditMode ? 'updated' : 'added'}!` 
      })

      if (!isEditMode) {
        setForm({
          name: '',
          category_id: 'Select Option',
          condition: 'Select Option',
          obtained_method: 'Select Option',
          purchase_date: '',
          location: 'Select Option',
          image: null,
          description: '',
          initial_quantity: 1
        })
      }

      // Navigate back to inventory after successful submission
      setTimeout(() => {
        navigate('/inventory')
      }, 500)

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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories from:', `${apiURL}/categories/`)
        const response = await fetch(`${apiURL}/categories/`, {
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('Categories data:', data)
        
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
        setSubmitStatus({ 
          type: 'error', 
          message: `Failed to fetch categories: ${error.message}` 
        })
      }
    }
    
    fetchCategories()
  }, [])

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
        
        <div className='lg:col-span-2'>
          <TextAreaInput 
            name='description' 
            title='Notes'
            placeholder='Notes'
            value={form.description} 
            onChange={handleFormChange}
          />
        </div>

        <div className='w-2/3 mt-8 mx-auto max-w-xs lg:col-start-2 lg:m-0 lg:justify-self-end'>
          <SubmitButton 
            text={isSubmitting ? 'SUBMITTING...' : isEditMode ? 'UPDATE PRODUCT' : 'ADD PRODUCT'} 
            type="submit"
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  )
}

export default ProductForm