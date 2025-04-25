import React, { useState, useEffect } from 'react'
import TestImage from '../../Images/ImagePlaceholder.png'

const ModalImage = ({ data, handler }) => {
  const { img, caption, open } = data
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  const display = open ? 'block' : 'hidden'

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', img)
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    console.error('Failed to load image URL:', img)
    setIsLoading(false)
    setHasError(true)
  }

  // Log the image URL when it changes
  useEffect(() => {
    if (img) {
      console.log('Attempting to load image from URL:', img)
    }
  }, [img])

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${display}`} onClick={handler}>
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
            // Add crossOrigin if your API is on a different domain
            crossOrigin="anonymous"
          />
          
          <div className="p-4 bg-white">
            <p className="text-center text-lg font-semibold font-Mulish text-secondaryBlue">
              {caption}
              {hasError && " (Failed to load image)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalImage
