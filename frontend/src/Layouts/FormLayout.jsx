import React from 'react'
import { Outlet } from 'react-router'

const FormLayout = ({ title }) => {
  return (
    <div className=''>
        <div className=' w-full h-screen bg-yanstoreLogo bg-opacity-10 bg-center bg-contain bg-no-repeat'>
          <div className='pt-3 pr-3 flex flex-row-reverse'>
            <div className='grid w-11/12 grid-rows-5 grid-cols-5 bg-circle bg-no-repeat bg-right bg-contain max-h-28 md:max-w-screen-md'>
              <p className='col-span-4 row-start-2 text-secondaryBlue font-Mulish font-black text-2xl md:text-3xl'>{ title }</p>
              <hr className='w-11/12 self-center row-start-3 col-span-full border-secondaryBlue border-2'/>
            </div>
          </div>
          <section>
            <Outlet/>
          </section>
        </div>
    </div>
  )
}

export default FormLayout