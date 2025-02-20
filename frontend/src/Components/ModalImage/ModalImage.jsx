import React from 'react'

const ModalImage = ({ data, handler }) => {
	let { img, caption, open } = data
	let display = open ? 'block' : 'hidden'

	return (
    <div className={`${display} fixed z-[1] top-0 left-0 w-full h-full overflow-auto bg-black bg-opacity-40`}>
      <span onClick={handler} className='absolute top-4 right-9 text-white text-5xl font-semibold'>
        &times;
      </span>
			<div className='flex h-screen justify-center items-center'>
			<div>
        <img src={img} alt={caption} />
      </div>
			<p>{caption}</p>
			</div>
    </div>
  )
}

export default ModalImage