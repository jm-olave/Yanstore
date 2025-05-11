import React, { useState, useEffect, useRef } from 'react'
import TestImage from '../../Images/ImagePlaceholder.png'

const ModalImage = ({ data, handler }) => {
  const { img, caption, open } = data
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const errorLogged = useRef(false)

  useEffect(() => {
    let isMounted = true

    const loadImage = async (url) => {
      try {
        if (!url || url.trim() === '') {
          throw new Error('Invalid image URL')
        }

        const response = await fetch(url, {
          credentials: 'omit',
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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={() => handler()}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '64rem',
          maxHeight: '80vh',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {isLoading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6'
          }}>
            <div style={{color: '#4b5563'}}>Loading...</div>
          </div>
        )}
        
        <img 
          src={hasError ? TestImage : imageUrl}
          alt={caption || 'Product Image'} 
          style={{
            maxHeight: '70vh',
            width: 'auto',
            margin: '0 auto',
            objectFit: 'contain',
            display: isLoading ? 'none' : 'block'
          }}
        />
        
        <div style={{padding: '1rem', backgroundColor: 'white'}}>
          <p style={{
            textAlign: 'center',
            fontSize: '1.125rem',
            fontWeight: '600',
            fontFamily: 'Mulish',
            color: '#1D3D91'
          }}>
            {caption}
            {hasError && " (Failed to load image)"}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModalImage
