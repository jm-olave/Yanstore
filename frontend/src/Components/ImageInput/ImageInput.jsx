import React from 'react'

const ImageInput = ({name, title, onChange}) => {
  // Remove the value prop since it can't be controlled for file inputs
  // Remove the form prop as it's not needed for this implementation
  
  const handleChange = (e) => {
    // Get the file object from the input
    const file = e.target.files[0];
    
    // Call the parent's onChange with an event-like object
    // This maintains consistency with how other form inputs work
    onChange({
      target: {
        name: name,
        value: file  // Pass the actual File object
      }
    });
  };

  return (
    <div className='grid my-3 p-3 md:grid-cols-3 items-center'>
      <label 
        className='text-secondaryBlue font-Mulish font-black text-2xl' 
        htmlFor={name}
      >
        {title}
      </label>
      <input 
        className='w-full file:p-2 file:my-2 file:text-white file:border 
                  file:bg-gradient-radial file:font-Mulish file:font-black 
                  from-secondaryBlue to-mainBlue md:w-full md:col-span-2 
                  md:col-start-2'
        name={name} 
        id={name}
        type='file'
        accept='image/*'
        onChange={handleChange}  // Use our custom handler
        // Remove the value prop as it's not needed for file inputs
      />
    </div>
  )
}

export default ImageInput