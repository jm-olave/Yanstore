import React, { useEffect, useState } from 'react'
import TextInput from '../Components/TextInput/TextInput'
import SubmitButton from '../Components/SubmitButton/SubmitButton'
import useApi from '../hooks/useApi'
import TableCol from '../Components/TableCol/TableCol'
import TableRow from '../Components/TableRow/TableRow'
import DeleteItemModal from '../Components/DeleteItemModal/DeleteItemModal'

const CategoryForm = () => {
  const { loading: apiLoading, error: apiError, createCategory, getCategories, deleteCategory } = useApi();
  
  const [form, setForm] = useState({
    category_name: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [categories, setCategories] = useState([])
  const [deleteConfirmation, setDeleteConfirmation] = useState({
      show: false,
      item: {}
    });
  const loading = apiLoading;

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
      
      // Refresh the categories list after adding a new category
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);

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

  // Handle product deletion
  const handleDeleteCategory = async () => {
    try {
      const categoryId = deleteConfirmation.item.category_id;
      
      if (!categoryId) return;
      
      const result = await deleteCategory(categoryId);
      
      // Remove the category from the state
      setCategories(categories.filter(category => category.category_id !== categoryId));
      
      setSubmitStatus({
        type: 'success',
        message: result.message || 'Category successfully deleted'
      });
      
      // Hide the confirmation dialog
      hideDeleteConfirmation();
      
    } catch (error) {
      console.error('Error deleting category:', error);
      setSubmitStatus({
        type: 'error',
        message: `Failed to delete category: ${error.message}`
      });
      
      // Hide the confirmation dialog
      hideDeleteConfirmation();
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        setSubmitStatus({ type: '', message: '' });

      } catch (error) {
        console.error('Error loading categories:', error);
        setSubmitStatus({
          type: 'error',
          message: `Failed to load categories: ${error.message}`
        });
      }
    }

    loadCategories()
    console.log(categories)
  }, [getCategories])

  // Display any API errors
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
          handleDeleteFunction={handleDeleteCategory}
          headers={['CATEGORY_NAME']}
          message={`Are you sure that you want to delete the category ${deleteConfirmation.category_name}?`}
        />
      )}

      <div className="w-11/12 pb-11 mx-auto lg:max-w-5xl">
        {submitStatus.message && (
          <div className={`mb-4 p-4 rounded-md ${submitStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {submitStatus.message}
          </div>
        )}

        <form className='lg:grid lg:grid-cols-3 lg:gap-4' onSubmit={handleSubmit}>
          <div className='flex flex-col justify-evenly lg:col-span-2'>
            <TextInput 
              name='category_name' 
              title='Category Name' 
              value={form.category_name} 
              onChange={handleFormChange}
              required
            />
          </div>

          <div className='w-2/3 mx-auto max-w-xs self-center lg:m-0 lg:justify-self-center'>
            <SubmitButton 
              text={isSubmitting ? 'SUBMITTING...' : 'ADD CATEGORY'} 
              type="submit"
              disabled={isSubmitting || apiLoading}
            />
          </div>
        </form>

        {loading ? (
            <div className="text-center py-8">
              <p>Loading inventory data...</p>
            </div>
          ) : (
            <section className='w-11/12 mx-auto max-w-7xl my-5'>
              <div className='overflow-x-auto relative'>
                <table className='w-full'>
                  <thead className='font-Mulish font-black text-secondaryBlue'>
                    <TableRow>
                      <TableCol text='NAME' key='NAME'/>
                      <TableCol text='DELETE' key='DELETE'/>
                    </TableRow>
                  </thead>
                  <tbody className='font-Josefin align-middle'>
                    {categories.map(item => ( 
                      <TableRow key={item.category_name}>
                        <TableCol text={item.category_name} key={`name-${item.category_name}`}/>
                        <TableCol key={`delete-${item.category_name}`}>
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
  );
};

export default CategoryForm;