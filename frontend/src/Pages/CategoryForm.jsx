import React, { useState } from 'react'
import TextInput from '../Components/TextInput/TextInput'
import SubmitButton from '../Components/SubmitButton/SubmitButton'
import useApi from '../hooks/useApi'

const CategoryForm = () => {
  const { loading: apiLoading, error: apiError, createCategory } = useApi();
  
  const [form, setForm] = useState({
    category_name: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const validateForm = () => {
    if (!form.category_name.trim()) {
      setSubmitStatus({ type: 'error', message: 'Category name is required' });
      return false;
    }
    return true;
  };

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const submitForm = async () => {
    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: '', message: '' });

      // Use our API hook to create the category
      const data = await createCategory(form);
      
      setSubmitStatus({ 
        type: 'success', 
        message: 'Category successfully added!' 
      });
      
      // Reset form after successful submission
      setForm({
        category_name: ''
      });

    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to submit form: ${error.message}` 
      });
      console.error('API Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      await submitForm();
    }
  };

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
            disabled={isSubmitting || apiLoading}
          />
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;