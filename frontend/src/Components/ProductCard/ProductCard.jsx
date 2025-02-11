import React from 'react'
import ImagePlaceholder from '../../Images/ImagePlaceholder.png'

const ProductCard = ({ id, name = 'Name', price = 0, notes, img = ImagePlaceholder }) => {
  return (
    <div className='m-5 bg-white p-4 border-4 border-secondaryBlue max-w-80'>
      <div className='flex py-1 px-2 justify-between bg-secondaryBlue border-2 border-secondaryBlue text-white font-Mulish font-black'>
        <div>{name}</div>
        <div>{`$${price}`}</div>
      </div>
      <div>
        <div className='my-4 border-2 border-secondaryBlue'>
          <img src={img} alt="productImage" />
        </div>
        <div className='flex flex-col items-center p-4 border-2 border-secondaryBlue'>
          <div className='mb-4 font-Josefin font-bold text-center leading-5 text-s'>
            {notes}
          </div>
          <div className='py-1 px-10 border border-secondaryBlue rounded-full text-secondaryBlue font-Mulish font-black cursor-pointer hover:text-white hover:bg-gradient-radial from-secondaryBlue to-mainBlue'>
            More info
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCard