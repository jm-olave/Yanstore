import React, { useState } from 'react'
import TextInput from '../Components/TextInput/TextInput'
import NumberInput from '../Components/NumberInput/NumberInput'
import InputSelect from '../Components/SelectInput/InputSelect'
import SubmitButton from '../Components/SubmitButton/SubmitButton'

const providerTypes = [
  {
    value: 'pt-0',
    label: 'Select Option'
  },
  {
    value: 'pt-1',
    label: 'Regular'
  },
  {
    value: 'pt-2',
    label: 'Premium'
  },
]

const paymentTermsOptions = [
  {
    value: 'pto-0',
    label: 'Select Option'
  },
  {
    value: 'pto-1',
    label: 'Cash'
  },
  {
    value: 'pto-2',
    label: 'Credit'
  },
  {
    value: 'pto-3',
    label: 'USD'
  },
  
]

const ProviderForm = () => {
  const [form, setForm] = useState({
    name: '',
    debtor_type: 'Select Option',
    contact_person: '',
    email: '',
    phone: '',
    payment_terms: 'Select Option',
    credit_limit: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

  const validateForm = () => {
    if (!form.name.trim()) {
      setSubmitStatus({ type: 'error', message: 'Name is required' })
      return false
    }
    if (form.debtor_type === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select a provider type' })
      return false
    }
    if (!form.email.trim()) {
      setSubmitStatus({ type: 'error', message: 'Email is required' })
      return false
    }
    if (!validateEmail(form.email)) {
      setSubmitStatus({ type: 'error', message: 'Please enter a valid email address' })
      return false
    }
    if (form.payment_terms === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select payment terms' })
      return false
    }
    if (!form.credit_limit || parseFloat(form.credit_limit) <= 0) {
      setSubmitStatus({ type: 'error', message: 'Please enter a valid credit limit' })
      return false
    }
    return true
  }

  const validateEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
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

      const response = await fetch('http://127.0.0.1:8000/supliers', {
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
        message: 'Provider information successfully added!' 
      })
      
      // Reset form after successful submission
      setForm({
        name: '',
        debtor_type: 'Select Option',
        contact_person: '',
        email: '',
        phone: '',
        payment_terms: 'Select Option',
        credit_limit: ''
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
            value={form.name} 
            onChange={handleFormChange}
            required
          />
          <InputSelect 
            name='provider_type' 
            title='Provider Type' 
            value={form.debtor_type} 
            options={providerTypes} 
            onChange={handleFormChange}
            required
          />
          <TextInput 
            name='contact_person' 
            title='Contact Person' 
            value={form.contact_person} 
            onChange={handleFormChange}
          />
        </div>

        <div className='flex flex-col lg:justify-between'>
          <TextInput 
            name='email' 
            title='Email' 
            value={form.email} 
            onChange={handleFormChange}
            required
          />
          <TextInput 
            name='phone' 
            title='Phone' 
            value={form.phone} 
            onChange={handleFormChange}
          />
          <InputSelect 
            name='payment_terms' 
            title='Payment Terms' 
            value={form.payment_terms} 
            options={paymentTermsOptions} 
            onChange={handleFormChange}
            required
          />
        </div>
        
        <div className='lg:col-span-2'>
          <NumberInput 
            name='credit_limit' 
            title='Credit Limit' 
            value={form.credit_limit} 
            onChange={handleFormChange}
            required
          />
        </div>

        <div className='w-2/3 mt-8 mx-auto max-w-xs lg:col-start-2 lg:m-0 lg:justify-self-end'>
          <SubmitButton 
            text={isSubmitting ? 'SUBMITTING...' : 'ADD PROVIDER'} 
            onClick={handleSubmit}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  )
}

export default ProviderForm