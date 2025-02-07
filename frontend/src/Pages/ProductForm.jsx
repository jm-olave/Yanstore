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
      value: 'm-0',
      label: 'Select Option'
    },
    {
      value: 'm-1',
      label: 'Audit'
    },
    {
      value: 'm-2',
      label: 'Purchase'
    },
    {
      value: 'm-3',
      label: 'Trade'
    },
  ]

  const conditions = [
    {
      value: 'c-0',
      label: 'Select Option'
    },
    {
      value: 'm-1',
      label: 'Mint'
    },
    {
      value: 'm-2',
      label: 'Near Mint'
    },
    {
      value: 'm-2',
      label: 'Excellent'
    },
    {
      value: 'm-2',
      label: 'Good'
    },
    {
      value: 'm-2',
      label: 'Lightly Played'
    },
    {
      value: 'm-2',
      label: 'Played'
    },
    {
      value: 'm-2',
      label: 'Poor'
    },
  ]

  const [form, setForm] = useState({
    name: '',
    categories: 'Select Option',
    condition: 'Select Option',
    obtainingMethod: 'Select Option',
    purchaseDate: '',
    image: '',
    notes: '',
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
    if (form.categories === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select a category' })
      return false
    }
    if (form.condition === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select a condition' })
      return false
    }
    if (form.obtainingMethod === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select an obtaining method' })
      return false
    }
    return true
  }

  const submitForm = async () => {
    try {
      setIsSubmitting(true)
      setSubmitStatus({ type: '', message: '' })

      const response = await fetch('http://127.0.0.1:8000/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setSubmitStatus({ 
        type: 'success', 
        message: 'Product successfully added!' 
      })
      
      // Reset form after successful submission
      setForm({
        name: '',
        categories: 'Select Option',
        condition: 'Select Option',
        obtainingMethod: 'Select Option',
        purchaseDate: '',
        image: '',
        notes: '',
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

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
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

      const data = await response.json() // Changed from response.body.json()
      return data

    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to fetch: ${error.message}` 
      })
      return [] // Return empty array in case of error
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
            name='categories' 
            title='Categories' 
            value={form.categories} 
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
            name='obtainingMethod' 
            title='Obtaining Method' 
            value={form.obtainingMethod} 
            options={optainingMethods} 
            onChange={handleFormChange}
          />
          <DateInput 
            name='purchaseDate' 
            title='Purchase Date' 
            value={form.purchaseDate} 
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
            name='notes' 
            title='Notes'
            placeholder='Notes'
            value={form.notes} 
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