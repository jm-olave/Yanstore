import React, { useState, useEffect, useRef } from 'react'
import TestImage from '../../Images/ImagePlaceholder.png'

const ModalImage = ({ data, handler }) => {
  const { img, caption, open } = data
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const errorLogged = useRef(false)
  
  const display = open ? 'block' : 'hidden'

  const handleBackgroundClick = (e) => {
    // Prevent event from reaching parent elements
    e.stopPropagation()
    
    // Check if the click was directly on the background
    if (e.target.classList.contains('modal-overlay')) {
      handler()
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadImage = async (url) => {
      try {
        if (!url || url.trim() === '') {
          throw new Error('Invalid image URL')
        }

        const response = await fetch(url, {
          credentials: 'omit', // Changed from 'include' to 'omit'
          mode: 'cors',
          headers: {
            'Accept': 'image/jpeg,image/png,*/*'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        
        if (isMounted) {
          setImageUrl(objectUrl)
          setIsLoading(false)
          setHasError(false)
        }
      } catch (error) {
        if (!errorLogged.current) {
          console.error('Failed to load image URL:', url, error)
          errorLogged.current = true
        }
        if (isMounted) {
          setIsLoading(false)
          setHasError(true)
        }
      }
    }

    if (!open) {
      setIsLoading(true)
      setHasError(false)
      setImageUrl('')
      errorLogged.current = false
    } else if (img) {
      loadImage(img)
    }

    return () => {
      isMounted = false
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [img, open])

  if (!open) return null

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 modal-overlay`}
      onClick={handleBackgroundClick}
    >
      <div className='flex flex-col h-screen justify-center items-center'>
        <div 
          className="max-w-4xl max-h-[80vh] bg-white rounded-lg overflow-hidden relative"
          onClick={(e) => e.stopPropagation()} // Prevent clicks on the content from closing the modal
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-gray-600">Loading...</div>
            </div>
          )}
          
          <img 
            src={hasError ? TestImage : imageUrl}
            alt={caption || 'Product Image'} 
            className="max-h-[70vh] w-auto mx-auto object-contain"
            style={{ display: isLoading ? 'none' : 'block' }}
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
