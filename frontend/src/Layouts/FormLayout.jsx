import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import BackArrow from '../Images/BackArrow.svg'

const FormLayout = ({ title }) => {

  let navigate = useNavigate()

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-[100vw] overflow-x-hidden">
        <div className=' w-full h-full bg-yanstoreLogo bg-opacity-10 bg-center bg-contain bg-no-repeat'>
            <div className='p-3 flex flex-row justify-end mx-auto md:max-w-screen-lg'>
              {/* <div className='flex items-center justify-center'>
                <img className='cursor-pointer' src={BackArrow} alt="navIcon" onClick={() => { navigate(-1) }}/>
              </div> */}
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
    </div>
  )
}

export default FormLayout