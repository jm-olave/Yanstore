import React, { useState, useEffect } from 'react'
import TextInput from '../Components/TextInput/TextInput'
import TableCol from '../Components/TableCol/TableCol'
import TableRow from '../Components/TableRow/TableRow'
import SubmitButton from '../Components/SubmitButton/SubmitButton'
import useApi from '../hooks/useApi'
import DeleteItemModal from '../Components/DeleteItemModal/DeleteItemModal'


const ProviderForm = () => {
  const { loading: apiLoading, error: apiError, createSupplier, getSuppliers, deleteSupplier} = useApi();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })
  const [suppliers, setSuppliers] = useState([])
  const [deleteConfirmation, setDeleteConfirmation] = useState({
        show: false,
        item: {}
  });

  const validateForm = () => {
    if (!form.name.trim()) {
      setSubmitStatus({ type: 'error', message: 'Name is required' })
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

      const data = await createSupplier(form)

      setSubmitStatus({ 
        type: 'success', 
        message: 'Supplier information successfully added!' 
      })
      
      // Reset form after successful submission
      setForm({
        name: '',
        email: '',
        phone: '',
      })

      const updatedSuppliers = await getSuppliers()
      setSuppliers(updatedSuppliers)

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

  // Show delete confirmation dialog
const showDeleteConfirmation = (item) => {
  setDeleteConfirmation({
    show: true,
    item: {...item}
  });
};

// Hide delete confirmation dialog
const hideDeleteConfirmation = () => {
  setDeleteConfirmation({
    show: false,
    item: {}
  });
};

const handleDeleteSupplier = async () => {
  try {
    const supplierId = deleteConfirmation.item.supplier_id;
    
    if (!supplierId) return;
    
    const result = await deleteSupplier(supplierId);
    
    // Remove the category from the state
    setSuppliers(suppliers.filter(supplier => supplier.supplier_id !== supplierId));
    
    setSubmitStatus({
      type: 'success',
      message: result.message || 'Supplier successfully deleted'
    });
    
    // Hide the confirmation dialog
    hideDeleteConfirmation();
    
  } catch (error) {
    console.error('Error deleting supplier:', error);
    setSubmitStatus({
      type: 'error',
      message: `Failed to delete supplier: ${error.message}`
    });
    
    // Hide the confirmation dialog
    hideDeleteConfirmation();
  }
};

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
        setSubmitStatus({ type: '', message: '' });

      } catch (error) {
        console.error('Error loading suppliers:', error);
        setSubmitStatus({
          type: 'error',
          message: `Failed to load suppliers: ${error.message}`
        });
      }
    }

    loadSuppliers()
    console.log(suppliers)
  }, [getSuppliers])

  useEffect(() => {
      if (apiError) {
        setSubmitStatus({
          type: 'error',
          message: apiError
        });
      }
    }, [apiError]);

  return (
    <>
      {deleteConfirmation.show && (
        <DeleteItemModal 
          deleteConfirmation={deleteConfirmation} 
          hideDeleteConfirmation={hideDeleteConfirmation} 
          handleDeleteFunction={handleDeleteSupplier}
          headers={['NAME', 'PHONE', 'EMAIL']}
          message={`Are you sure that you want to delete the supplier ${deleteConfirmation.item.name}?`}
        />
      )}

      <div className="w-11/12 pb-11 mx-auto lg:max-w-5xl">
        {submitStatus.message && (
          <div className={`mb-4 p-4 rounded-md ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {submitStatus.message}
          </div>
        )}

        <form className='lg:grid lg:grid-cols-3 lg:gap-4'>
          <div className='flex flex-col'>
            <TextInput 
              name='name' 
              title='Name' 
              value={form.name} 
              onChange={handleFormChange}
              placeholder='Enter Name'
              required
            />
          </div>
          <div className='flex flex-col'>
            <TextInput 
              name='email' 
              title='Email' 
              value={form.email} 
              onChange={handleFormChange}
              placeholder='Enter Email'
              required
            />
          </div>

          <div className='flex flex-col'>
            <TextInput 
              name='phone' 
              title='Phone' 
              value={form.phone} 
              onChange={handleFormChange}
              placeholder='Enter Phone'
            />
          </div>

          <div className='w-full mx-auto max-w-xs lg:col-start-2'>
            <SubmitButton 
              text={isSubmitting ? 'SUBMITTING...' : 'ADD PROVIDER'} 
              onClick={handleSubmit}
              disabled={isSubmitting}
            />
          </div>
        </form>

        {apiLoading ? (
          <div className="text-center py-8">
            <p>Loading Supplier data...</p>
          </div>
        ) : (
          <section className='w-11/12 mx-auto max-w-7xl my-5'>
            <div className='overflow-x-auto relative'>
              <table className='w-full'>
                <thead className='font-Mulish font-black text-secondaryBlue'>
                  <TableRow>
                    <TableCol text='NAME' key='NAME'/>
                    <TableCol text='EMAIL' key='EMAIL'/>
                    <TableCol text='PHONE' key='PHONE'/>
                    <TableCol text='DELETE' key='DELETE'/>
                  </TableRow>
                </thead>
                <tbody className='font-Josefin align-middle'>
                  {suppliers.map(item => ( 
                    <TableRow key={item.name}>
                      <TableCol text={item.name} key={`name-${item.name}`}/>
                      <TableCol text={item.email} key={`email-${item.email}`}/>
                      <TableCol text={item.phone} key={`phone-${item.phone}`}/>
                      <TableCol key={`delete-${item.name}`}>
                        <div 
                          className='text-mainRed font-bold cursor-pointer'
                          onClick={() => showDeleteConfirmation(item)}
                        >
                          Delete
                        </div>
                      </TableCol>
                    </TableRow>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

export default ProviderForm