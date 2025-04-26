import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import Logo from '../Images/YanstoreLogo.png'

const PageLayout = () => {
  return (
    <div className='h-screen'>
        <section className='w-full flex items-center p-3 pl-5 bg-mainBlue h-[6%]'></section>
        <div className='flex h-[94%]'>
            <section className='h-full bg-mainBlue w-[15%]'>
                <div className='w-32 mx-auto'>
                    <img src={Logo} alt="Yanstore Logo" className='object-scale-down'/>
                </div>
                <nav className='py-5 w-3/4 mx-auto flex flex-col justify-center'>
                    <ul className='text-center text-white font-Mulish font-black text-sm'>
                        <li className='my-5 border-b-2 cursor-pointer'>
                            <Link to='add-product'>ADD PRODUCT</Link>
                        </li>
                        <li className='my-5 border-b-2 cursor-pointer'>
                            <Link to='add-category'>ADD CATEGORY</Link>
                        </li>
                        <li className='my-5 border-b-2 cursor-pointer'>
                            <Link to='inventory'>INVENTORY</Link>
                        </li>
                        <li className='my-5 border-b-2 cursor-pointer'>
                            <Link to='statistics'>STATISTICS</Link>
                        </li>
                    </ul>
                </nav>
            </section>
            <section className='w-[85%]'>
                    <Outlet/>
            </section>
        </div>
    </div>
  )
}

export default PageLayout