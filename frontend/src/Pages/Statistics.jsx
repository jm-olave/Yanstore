import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from "../hooks/useApi";
import MigrationButton from '../Components/MigrationButton/MigrationButton';

const Statistics = () => {
  const { getProducts, getCategories } = useApi();

  const [stats, setStats] = useState({
    total: 0,
    byCategory: {},
    byLocation: {
      Colombia: 0,
      USA: 0
    },
    byAge: {
      lessThan30Days: 0,
      lessThan90Days: 0,
      lessThan180Days: 0,
      moreThan180Days: 0
    }
  });

  const calculateProductAge = (products) => {
    const now = new Date();
    return products.reduce((acc, product) => {
      const createdDate = new Date(product.created_at);
      const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      if (ageInDays <= 30) acc.lessThan30Days++;
      else if (ageInDays <= 90) acc.lessThan90Days++;
      else if (ageInDays <= 180) acc.lessThan180Days++;
      else acc.moreThan180Days++;

      return acc;
    }, {
      lessThan30Days: 0,
      lessThan90Days: 0,
      lessThan180Days: 0,
      moreThan180Days: 0
    });
  };

  const calculateStats = async (products) => {
    // Get categories for mapping
    const categoriesData = await getCategories();
    const categoriesMap = categoriesData.reduce((acc, cat) => {
      acc[cat.category_id] = cat.category_name;
      return acc;
    }, {});

    // Calculate statistics
    const statistics = {
      total: products.length,
      byCategory: {},
      byLocation: {
        Colombia: 0,
        USA: 0
      },
      byAge: calculateProductAge(products)
    };

    // Count by category and location
    products.forEach(product => {
      const categoryName = categoriesMap[product.category_id] || 'Uncategorized';
      statistics.byCategory[categoryName] = (statistics.byCategory[categoryName] || 0) + 1;
      
      const location = product.location || 'Colombia';
      statistics.byLocation[location] = (statistics.byLocation[location] || 0) + 1;
    });

    setStats(statistics);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getProducts();
        await calculateStats(data);
      } catch (error) {
        console.error(`Error fetching the product data:`, error);
      }
    };
    loadData();
  }, []);

  return (
    <div className="w-11/12 mx-auto max-w-7xl h-full">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-secondaryBlue">Statistics Overview</h2>
        <div className="flex gap-4">
          <MigrationButton />
          <Link 
            to="/inventory"
            className="bg-secondaryBlue text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Inventory
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Products Card */}
        <div className="bg-white p-6 rounded-lg shadow-md m-4">
          <h3 className="text-xl font-semibold text-secondaryBlue mb-4">Total Products</h3>
          <p className="text-4xl font-bold">{stats.total}</p>
        </div>

        {/* Location Distribution Card */}
        <div className="bg-white p-6 rounded-lg shadow-md m-4">
          <h3 className="text-xl font-semibold text-secondaryBlue mb-4">Products by Location</h3>
          <div className="space-y-4">
            {Object.entries(stats.byLocation).map(([location, count]) => (
              <div key={location} className="flex justify-between items-center">
                <span className="font-medium">{location}</span>
                <span className="text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution Card */}
        <div className="bg-white p-6 rounded-lg shadow-md m-4">
          <h3 className="text-xl font-semibold text-secondaryBlue mb-4">Products by Category</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="font-medium">{category}</span>
                <span className="text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Age Card */}
        <div className="bg-white p-6 rounded-lg shadow-md m-4">
          <h3 className="text-xl font-semibold text-secondaryBlue mb-4">Inventory Age</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Less than 30 days</span>
              <span className="text-lg font-bold">{stats.byAge.lessThan30Days}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">30-90 days</span>
              <span className="text-lg font-bold">{stats.byAge.lessThan90Days}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">90-180 days</span>
              <span className="text-lg font-bold">{stats.byAge.lessThan180Days}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">More than 180 days</span>
              <span className="text-lg font-bold">{stats.byAge.moreThan180Days}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics
