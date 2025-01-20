import React from 'react'

import yanstoreGradient from '../../Images/YanstoreGradient.png'

const YanstoreLogo = () => {
  return (
    <div className='w-full flex justify-center pt-10'>
      <figure className='flex justify-center w-full'>
        <img className ='w-10/12'
          src={yanstoreGradient} 
          alt="Yanstore Logo"
        />
      </figure>
    </div>
  )
}

export default YanstoreLogo