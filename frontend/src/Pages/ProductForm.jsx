import React, { useEffect, useState } from 'react'
import InputSelect from '../Components/SelectInput/InputSelect'
import TextInput from '../Components/TextInput/TextInput'
import DateInput from '../Components/DateInput/DateInput'
import ImageInput from '../Components/ImageInput/ImageInput'
import TextAreaInput from '../Components/TextAreaInput/TextAreaInput'
import SubmitButton from '../Components/SubmitButton/SubmitButton'

const ProductForm = () => {
  const optainingMethods = [
    {
      value: 'Select Option',
      label: 'Select Option'
    },
    {
      value: 'Audit',
      label: 'Audit'
    },
    {
      value: 'Purchase',
      label: 'Purchase'
    },
    {
      value: 'Trade',
      label: 'Trade'
    },
  ]

  const conditions = [
    {
      value: 'Select Option',
      label: 'Select Option'
    },
    {
      value: 'Mint',
      label: 'Mint'
    },
    {
      value: 'Near Mint',
      label: 'Near Mint'
    },
    {
      value: 'Excellent',
      label: 'Excellent'
    },
    {
      value: 'Good',
      label: 'Good'
    },
    {
      value: 'Lightly Played',
      label: 'Lightly Played'
    },
    {
      value: 'Played',
      label: 'Played'
    },
    {
      value: 'Poor',
      label: 'Poor'
    },
  ]

  const [form, setForm] = useState({
    name: '',
    category_id: 'Select Option',
    condition: 'Select Option',
    obtained_method: 'Select Option',
    purchase_date: '',
    image: '',
    description: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })
  const [categories, setCategories] = useState([
    { value: 'Select Option', label: 'Select Option' }
  ])

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
    if (!form.purchase_date) {
      setSubmitStatus({ type: 'error', message: 'Purchase date is required' })
      return false
    }
    return true
  }

  const handleFormChange = (e) => {
    setForm(prevForm => ({
      ...prevForm,
      [e.target.name]: e.target.value  
    }));
  };

  const submitForm = async () => {
    try {
      setIsSubmitting(true)
      setSubmitStatus({ type: '', message: '' })
      
      // Create FormData object to handle file upload
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('category_id', form.category_id)
      formData.append('condition', form.condition)
      formData.append('obtained_method', form.obtained_method)
      formData.append('purchase_date', form.purchase_date)
      formData.append('description', form.description)
      if (form.image) {
        formData.append('image', form.image)
      }
      console.log('Form data being submitted:', Object.fromEntries(formData))

      const response = await fetch('http://127.0.0.1:8000/products', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Submission error:', errorData)
        throw new Error(`Error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      setSubmitStatus({ 
        type: 'success', 
        message: 'Product successfully added!' 
      })
      
      // Reset form after successful submission
      setForm({
        name: '',
        category_id: 'Select Option',
        condition: 'Select Option',
        obtained_method: 'Select Option',
        purchase_date: '',
        image: '',
        description: '',
      })
      
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to submit form: ${error.message}` 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (validateForm()) {
      await submitForm()
    }
  }

  const getCategories = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/categories', {
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
      const data = await getCategories()
      const mappedCategories = [
        { value: 'Select Option', label: 'Select Option' },
        ...data.map(cat => ({
          value: cat.category_id,
          label: cat.category_name
        }))
      ]
      setCategories(mappedCategories)
    }
    fetchData()
  }, [])

  return (
    <div className="w-11/12 pb-11 mx-auto lg:max-w-5xl">
      {submitStatus.message && (
        <div className={`mb-4 p-4 rounded-md ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {submitStatus.message}
        </div>
      )}

      <form className='lg:grid lg:grid-cols-2 lg:gap-4'>
        <div className='flex flex-col justify-evenly'>
          <TextInput 
            name='name' 
            title='Name'
            placeholder='Name'
            value={form.name} 
            onChange={handleFormChange}
          />
          <InputSelect 
            name='category_id'  // Changed from 'categories' to match form state
            title='Categories' 
            value={form.category_id} 
            options={categories} 
            onChange={handleFormChange}
          />
          <InputSelect 
            name='condition' 
            title='Condition' 
            value={form.condition} 
            options={conditions} 
            onChange={handleFormChange}
          />
        </div>

        <div className='flex flex-col'>
          <InputSelect 
            name='obtained_method'
            title='Obtaining Method' 
            value={form.obtained_method} 
            options={optainingMethods} 
            onChange={handleFormChange}
          />
          <DateInput 
            name='purchase_date'
            title='Purchase Date' 
            value={form.purchase_date} 
            onChange={handleFormChange}
          />
          <ImageInput 
            name='image' 
            title='Image' 
            value={form.image} 
            onChange={handleFormChange}
          />
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
            text={isSubmitting ? 'SUBMITTING...' : 'ADD PRODUCT'} 
            onClick={handleSubmit}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  )
}



export default ProductForm