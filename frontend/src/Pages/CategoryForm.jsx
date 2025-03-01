import React, { useState } from 'react'
import TextInput from '../Components/TextInput/TextInput'
import SubmitButton from '../Components/SubmitButton/SubmitButton'

const CategoryForm = () => {
  const [form, setForm] = useState({
    category_name: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

  // Get API URL from environment variables or use a default
  const apiURL = 'https://yanstore-api-6e6412b99156.herokuapp.com/'

  const validateForm = () => {
    if (!form.category_name.trim()) {
      setSubmitStatus({ type: 'error', message: 'Category name is required' })
      return false
    }
    return true
  }

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const submitForm = async () => {
    try {
      setIsSubmitting(true)
      setSubmitStatus({ type: '', message: '' })

      const response = await fetch(`${apiURL}/categories/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = `Error: ${response.status}`
        
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : Array.isArray(errorData.detail)
              ? errorData.detail.map(err => err.msg).join(', ')
              : errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setSubmitStatus({ 
        type: 'success', 
        message: 'Category successfully added!' 
      })
      
      // Reset form after successful submission
      setForm({
        category_name: ''
      })

    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to submit form: ${error.message}` 
      })
      console.error('API Error:', error)
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

  return (
    <div className="w-11/12 pb-11 mx-auto lg:max-w-5xl">
      {submitStatus.message && (
        <div className={`mb-4 p-4 rounded-md ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {submitStatus.message}
        </div>
      )}

      <form className='lg:grid lg:grid-cols-1 lg:gap-4' onSubmit={handleSubmit}>
        <div className='flex flex-col justify-evenly'>
          <TextInput 
            name='category_name' 
            title='Category Name' 
            value={form.category_name} 
            onChange={handleFormChange}
            required
          />
        </div>

        <div className='w-2/3 mt-8 mx-auto max-w-xs lg:m-0 lg:justify-self-end'>
          <SubmitButton 
            text={isSubmitting ? 'SUBMITTING...' : 'ADD CATEGORY'} 
            type="submit"
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  )
}

export default CategoryForm