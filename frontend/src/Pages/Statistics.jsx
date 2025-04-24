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
    const categoryCount = {};
    products.forEach(product => {
      const category = product.category.category_name;
      categoryCount[category] = (categoryCount[category] || 0) + product.quantity;
    });
    return categoryCount;
  };

  const calculateTotalOfProductsPerLocation = (products) => {
    const locationCount = {};
    products.forEach(product => {
      if (product.location) {
        locationCount[product.location] = (locationCount[product.location] || 0) + product.quantity;
      }
    });
    return locationCount;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getProducts();
        const totalProducts = data.reduce((sum, product) => sum + product.quantity, 0);
        const byCategory = calculateTotalOfProductsPerCategory(data);
        const byLocation = calculateTotalOfProductsPerLocation(data);

        setProducts({
          total: totalProducts,
          byCategory,
          byLocation
        });
      } catch (error) {
        console.error(`Error fetching the product data:`, error);
      }
    };
    loadData();
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Statistics</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Total Products: {products.total}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Products by Category</h3>
          <ul>
            {Object.entries(products.byCategory).map(([category, count]) => (
              <li key={category} className="flex justify-between py-2 border-b">
                <span>{category}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Products by Location</h3>
          <ul>
            {Object.entries(products.byLocation).map(([location, count]) => (
              <li key={location} className="flex justify-between py-2 border-b">
                <span>{location || 'No Location'}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Statistics
