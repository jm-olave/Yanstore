import React, { useEffect, useState } from 'react'
import useApi from "../hooks/useApi";

const Statistics = () => {

  const { getProducts } = useApi();

  const [products, setProducts] = useState({
    total: 0,
    byCategory: {},
    byLocation: {}
  })

  const calculateTotalOfProductsPerCategory = (products) => {
    
  }

  const calculateTotalOfProductsPerLocation = (products) => {
    
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getProducts()

        console.log(data)
      } catch (error) {
        console.error(`Error fetching the product data:`, error)
      }
    }
    loadData()
  }, [])

  return (
    <div>

    </div>
  )
}

export default Statistics