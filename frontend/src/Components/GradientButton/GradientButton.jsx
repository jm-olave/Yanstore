import React from 'react'
import { NavLink } from 'react-router-dom'

const GradientButton = ({ text, url }) => {
  return (
    <NavLink to={ url } className='w-full p-8 border bg-gradient-radial from-secondaryBlue to-mainBlue md:max-w-15 lg:max-w-sm'>
      <span className='font-Mulish font-black text-2xl'>
        { text }
      </span>
    </NavLink>
  )
}

export default GradientButton