import React, { useState, useEffect, useRef } from 'react'
import TestImage from '../../Images/ImagePlaceholder.png'

const ModalImage = ({ data, handler }) => {
  const { img, caption, open } = data
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const errorLogged = useRef(false)
  
  const display = open ? 'block' : 'hidden'

  useEffect(() => {
    // Reset states when modal opens/closes
    if (!open) {
      setIsLoading(true)
      setHasError(false)
      setImageUrl('')
      errorLogged.current = false
      return
    }

    // Only set image URL if we have a valid img prop
    if (img && img.trim() !== '') {
      setImageUrl(img)
      setIsLoading(true)
      setHasError(false)
    } else {
      setHasError(true)
      setIsLoading(false)
    }
  }, [img, open])

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    // Only log error once per modal open
    if (!errorLogged.current) {
      console.error('Failed to load image URL:', imageUrl)
      errorLogged.current = true
    }
    setIsLoading(false)
    setHasError(true)
  }

  // Stop propagation on modal content click
  const handleContentClick = (e) => {
    e.stopPropagation()
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${display}`} onClick={handler}>
      <div className='flex flex-col h-screen justify-center items-center' onClick={handleContentClick}>
        <div className="max-w-4xl max-h-[80vh] bg-white rounded-lg overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-gray-600">Loading...</div>
            </div>
          )}
          
          {/* Only render img element if we have a URL */}
          {imageUrl && (
            <img 
              src={hasError ? TestImage : imageUrl}
              alt={caption || 'Product Image'} 
              className="max-h-[70vh] w-auto mx-auto object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: isLoading ? 'none' : 'block' }}
            />
          )}
          
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
