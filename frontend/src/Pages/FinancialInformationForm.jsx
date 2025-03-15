import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import NumberInput from '../Components/NumberInput/NumberInput'
import TextInput from '../Components/TextInput/TextInput'
import DateInput from '../Components/DateInput/DateInput'
import InputSelect from '../Components/SelectInput/InputSelect'
import SubmitButton from '../Components/SubmitButton/SubmitButton'

const paymentMethods = [
  { value: 'Select Option', label: 'Select Option' },
  { value: 'Credit', label: 'Credit' },
  { value: 'Cash', label: 'Cash' },
  { value: 'USD', label: 'USD' },
  { value: 'Trade', label: 'Trade' }
]

const FinancialInformationForm = () => {
  const { productId } = useParams() // Using React Router's useParams hook

  const [form, setForm] = useState({
    product_id: productId || '', // Initialize with productId from URL params
    base_cost: '',
    selling_price: '',
    market_price: '',
    currency: 'USD',
    payment_method: 'Select Option',
    sell_date: '',
    effective_from: new Date().toISOString(),
    notes: ''
  })

  const [product, setProduct] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

  // Fetch product details when productId is available
  useEffect(() => {
    if (productId) {
      fetchProductDetails(productId)
    }
  }, [productId])

  const fetchProductDetails = async (id) => {
    try {
      const response = await fetch(`https://yanstore-api-6e6412b99156.herokuapp.com/products/${productId}`)
      if (!response.ok) throw new Error('Failed to fetch product details')
      const data = await response.json()
      setProduct(data)
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Failed to fetch product details' })
    }
  }

  const validateForm = () => {
    if (!form.base_cost || parseFloat(form.base_cost) <= 0) {
      setSubmitStatus({ type: 'error', message: 'Base cost is required and must be greater than 0' })
      return false
    }
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) {
      setSubmitStatus({ type: 'error', message: 'Selling price is required and must be greater than 0' })
      return false
    }
    if (form.payment_method === 'Select Option') {
      setSubmitStatus({ type: 'error', message: 'Please select a payment method' })
      return false
    }
    if (!form.sell_date) {
      setSubmitStatus({ type: 'error', message: 'Sale date is required' })
      return false
    }
    return true
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const submitForm = async () => {
    try {
      setIsSubmitting(true)
      setSubmitStatus({ type: '', message: '' })

      // First, create the price point
      const pricePointResponse = await fetch('https://yanstore-api-6e6412b99156.herokuapp.com/price-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: form.product_id,
          base_cost: parseFloat(form.base_cost),
          selling_price: parseFloat(form.selling_price),
          market_price: form.market_price ? parseFloat(form.market_price) : null,
          currency: form.currency,
          effective_from: form.effective_from
        })
      })

      if (!pricePointResponse.ok) throw new Error('Failed to create price point')

      // Then, register the sale
      const saleResponse = await fetch('https://yanstore-api-6e6412b99156.herokuapp.com/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: form.product_id,
          sale_price: parseFloat(form.selling_price),
          sale_date: form.sell_date,
          payment_method: form.payment_method,
          notes: form.notes
        })
      })

      if (!saleResponse.ok) throw new Error('Failed to register sale')

      setSubmitStatus({ type: 'success', message: 'Sale successfully registered!' })
      
      // Reset form
      setForm({
        product_id: productId || '', // Maintain the productId
        base_cost: '',
        selling_price: '',
        market_price: '',
        currency: 'USD',
        payment_method: 'Select Option',
        sell_date: '',
        effective_from: new Date().toISOString(),
        notes: ''
      })

    } catch (error) {
      setSubmitStatus({ type: 'error', message: `Failed to submit: ${error.message}` })
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
      {product && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Product Details</h2>
          <p className="mb-1"><span className="font-medium">Name:</span> {product.name}</p>
          <p className="mb-1"><span className="font-medium">SKU:</span> {product.sku}</p>
          <p><span className="font-medium">Condition:</span> {product.condition}</p>
        </div>
      )}

      {submitStatus.message && (
        <div className={`mb-4 p-4 rounded-md ${
          submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {submitStatus.message}
        </div>
      )}

      <form className="lg:grid lg:grid-cols-2 lg:gap-4">
        <div className="flex flex-col justify-evenly">
          <NumberInput 
            name="base_cost"
            title="Base Cost"
            value={form.base_cost}
            onChange={handleFormChange}
          />
          <NumberInput 
            name="selling_price"
            title="Selling Price"
            value={form.selling_price}
            onChange={handleFormChange}
          />
          <NumberInput 
            name="market_price"
            title="Market Price (Optional)"
            value={form.market_price}
            onChange={handleFormChange}
          />
        </div>

        <div className="flex flex-col justify-evenly">
          <InputSelect 
            name="payment_method"
            title="Payment Method"
            value={form.payment_method}
            options={paymentMethods}
            onChange={handleFormChange}
          />
          <DateInput 
            name="sell_date"
            title="Sale Date"
            value={form.sell_date}
            onChange={handleFormChange}
          />
          <TextInput 
            name="notes"
            title="Notes"
            value={form.notes}
            onChange={handleFormChange}
          />
        </div>

        <div className="w-2/3 mt-8 mx-auto max-w-xs lg:col-start-2 lg:m-0 lg:justify-self-end">
          <SubmitButton 
            text={isSubmitting ? 'REGISTERING SALE...' : 'REGISTER SALE'}
            onClick={handleSubmit}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  )
}

export default FinancialInformationForm