import React from 'react'

// Components
import YanstoreLogo from '../Components/YanstoreLogo/YanstoreLogo'
import GradientButton from '../Components/GradientButton/GradientButton'

const MainMenu = () => {
  return (
    <>
      <div className='bg-mainBlue pb-8 md:flex-row-reverse md:grid md:grid-cols-2 md:h-screen'>
        <div className='md:max-w-md xl:max-w-3xl md:col-start-2 md:my-auto'>
          <YanstoreLogo/>
        </div>
        <section className='flex flex-col justify-center text-center m-8 md:items-center md:col-start-1 md:row-start-1'>
          <h1 className='font-Mulish font-black text-white text-4xl'>Main Menu</h1>
          <div className='flex flex-col justify-center items-center w-4/5 mt-14 mx-auto gap-14 text-white md:w-full md:gap-8'>
            <GradientButton url={'add-product'} text={'ADD PRODUCT'}/>
            <GradientButton url={'add-category'} text={'ADD CATEGORY'}/>
            <GradientButton url={'inventory'} text={'INVENTORY'}/>
          </div>
        </section>
      </div>
    </>
  )
}

export default MainMenu