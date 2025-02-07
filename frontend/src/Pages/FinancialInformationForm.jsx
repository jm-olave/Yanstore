import React, { useState } from 'react'
import NumberInput from '../Components/NumberInput/NumberInput'
import TextInput from '../Components/TextInput/TextInput'
import DateInput from '../Components/DateInput/DateInput'
import InputSelect from '../Components/SelectInput/InputSelect'
import SubmitButton from '../Components/SubmitButton/SubmitButton'

const paymentMethods = [
  'Select Option',
  'Credit',
  'Cash',
  'USD',
  'Trade'
]

const FinancialInformationForm = () => {
  const [form, setForm] = useState({
    costUsd: '',
    amountPaid: '',
    paymentMethod: 'Select Option',
    conversionRate: '',
    shippingCost: '',
    totalPaid: '',
    sellingPrice: '',
    sellDate: '',
    earnings: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

  const validateForm = () => {
    if (!form.costUsd) {
      setSubmitStatus({ type: 'error', message: 'Base Cost USD is required' })
      return false
    }
    if (!form.amountPaid) {
      setSubmitStatus({ type: 'error', message: 'Amount Paid COP is required' })
      return false
    }
    if (form.paymentMethod === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select a payment method' })
      return false
    }
    return true
  }

  const calculateTotal = () => {
    const baseAmount = parseFloat(form.amountPaid) || 0
    const shipping = parseFloat(form.shippingCost) || 0
    return baseAmount + shipping
  }

  const calculateEarnings = () => {
    const sellingPrice = parseFloat(form.sellingPrice) || 0
    const totalCost = calculateTotal()
    return sellingPrice - totalCost
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(prevForm => {
      const newForm = {
        ...prevForm,
        [name]: value
      }

      // Auto-calculate totalPaid when relevant fields change
      if (name === 'amountPaid' || name === 'shippingCost') {
        newForm.totalPaid = calculateTotal().toString()
      }

      // Auto-calculate earnings when selling price changes
      if (name === 'sellingPrice') {
        newForm.earnings = calculateEarnings().toString()
      }

      return newForm
    })
  }

  const submitForm = async () => {
    try {
      setIsSubmitting(true)
      setSubmitStatus({ type: '', message: '' })

      const response = await fetch('http://127.0.0.1:8000/financial-info', {
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
        message: 'Financial information successfully added!' 
      })
      
      // Reset form after successful submission
      setForm({
        costUsd: '',
        amountPaid: '',
        paymentMethod: 'Select Option',
        conversionRate: '',
        shippingCost: '',
        totalPaid: '',
        sellingPrice: '',
        sellDate: '',
        earnings: ''
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
    <>
      <div className=''>
        <span className=''>Product Name:</span>
        <span className=''>Name of the product</span>
      </div>
      <div className="w-11/12 pb-11 mx-auto lg:max-w-5xl">
        {submitStatus.message && (
          <div className={`mb-4 p-4 rounded-md ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {submitStatus.message}
          </div>
        )}

        <form className='lg:grid lg:grid-cols-2 lg:gap-4'>
          <div className='flex flex-col justify-evenly'>
            <NumberInput 
              name='costUsd' 
              title='Base Cost USD' 
              value={form.costUsd} 
              onChange={handleFormChange}
            />
            <NumberInput 
              name='amountPaid' 
              title='Amount Paid COP' 
              value={form.amountPaid} 
              onChange={handleFormChange}
            />
            <InputSelect 
              name='paymentMethod' 
              title='Method of Payment' 
              value={form.paymentMethod} 
              options={paymentMethods} 
              onChange={handleFormChange}
            />
          </div>

          <div className='flex flex-col'>
            <TextInput 
              name='conversionRate' 
              title='Conversion Rate' 
              value={form.conversionRate} 
              onChange={handleFormChange}
              readonly
            />
            <NumberInput 
              name='shippingCost' 
              title='Shipping Cost' 
              value={form.shippingCost} 
              onChange={handleFormChange}
            />
            <TextInput 
              name='totalPaid' 
              title='Total Paid' 
              value={form.totalPaid} 
              onChange={handleFormChange}
              readonly
            />
          </div>
          
          <div className='lg:grid lg:grid-cols-2 lg:col-span-2'>
            <NumberInput 
              name='sellingPrice' 
              title='Selling Price' 
              value={form.sellingPrice} 
              onChange={handleFormChange}
            />
            <DateInput 
              name='sellDate' 
              title='Selling Date' 
              value={form.sellDate} 
              onChange={handleFormChange}
            />
            <div className='lg:col-start-2'>
              <TextInput 
                name='earnings' 
                title='Earnings' 
                value={form.earnings} 
                onChange={handleFormChange}
                readonly
              />
            </div>
          </div>

          <div className='w-2/3 mt-8 mx-auto max-w-xs lg:col-start-2 lg:m-0 lg:justify-self-end'>
            <SubmitButton 
              text={isSubmitting ? 'SUBMITTING...' : 'ADD FINANCIAL INFO'} 
              onClick={handleSubmit}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </>
  )
}

export default FinancialInformationForm