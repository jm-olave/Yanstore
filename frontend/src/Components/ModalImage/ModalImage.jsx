import React, { useState } from 'react'
import TestImage from '../../Images/ImagePlaceholder.png'

const ModalImage = ({ data, handler, onImageError }) => {
  const { img, caption, open } = data
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  const display = open ? 'block' : 'hidden'

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
    // Call the parent component's error handler
    if (onImageError) {
      onImageError()
    }
  }

  return (
    <div className={`${display} fixed z-50 top-0 left-0 w-full h-full overflow-auto bg-black bg-opacity-75`}>
      <span 
        onClick={handler} 
        className='absolute top-4 right-9 text-white text-5xl font-semibold hover:text-gray-300 cursor-pointer'
      >
        &times;
      </span>
      
      <div className='flex flex-col h-screen justify-center items-center'>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Loading...
          </div>
        )}
        
        <div className="max-w-4xl max-h-[80vh] bg-white rounded-lg overflow-hidden">
          <img 
            src={hasError ? TestImage : img} 
            alt={caption} 
            className="max-h-[70vh] w-auto mx-auto object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          <div className="p-4 bg-white">
            <p className="text-center text-lg font-semibold font-Mulish text-secondaryBlue">{caption}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalImage