import React, { useState, useEffect } from 'react';
import NumberInput from '../NumberInput/NumberInput';
import InputSelect from '../SelectInput/InputSelect';

const conditions = [
  { value: "New", label: "New" },
  { value: "Used", label: "Used" },
  { value: "Damaged", label: "Damaged" },
];

const cardConditions = [
  { value: "Mint", label: "Mint" },
  { value: "Near Mint", label: "Near Mint" },
  { value: "Excellent", label: "Excellent" },
  { value: "Good", label: "Good" },
  { value: "Lightly Played", label: "Lightly Played" },
  { value: "Played", label: "Played" },
  { value: "Poor", label: "Poor" },
  { value: "New", label: "New" },
  { value: "Used", label: "Used" },
  { value: "Damaged", label: "Damaged" }
];

const locations = [
  { value: "Colombia", label: "Colombia" },
  { value: "USA", label: "USA" },
];

const AddInstanceModal = ({ selectedProduct, setAddInstanceModalOpen, handleAddInstance }) => {
  const [instances, setInstances] = useState([]);
  const [instanceData, setInstanceData] = useState({
    base_cost: '',
    location: 'Colombia',
    condition: 'New'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstances();
  }, [selectedProduct]);

  const fetchInstances = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/instances/`);
      if (response.ok) {
        const allInstances = await response.json();
        const productInstances = allInstances.filter(instance => 
          instance.product_id === selectedProduct.product_id
        );
        setInstances(productInstances);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!instanceData.base_cost || parseFloat(instanceData.base_cost) <= 0) {
      alert('Please enter a valid base cost');
      return;
    }
    
    const newInstance = {
      ...instanceData,
      base_cost: parseFloat(instanceData.base_cost),
      purchase_date: new Date().toISOString().split('T')[0]
    };
    
    handleAddInstance(newInstance);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-4 text-mainBlue">Add Instance - {selectedProduct.name}</h2>
        
        {/* Existing Instances */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Existing Instances ({instances.length})</h3>
          {loading ? (
            <p className="text-gray-500">Loading instances...</p>
          ) : instances.length > 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
              {instances.map((instance, index) => (
                <div key={instance.instance_id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-sm">Instance #{index + 1}</span>
                  <span className="text-sm font-medium">${instance.base_cost}</span>
                  <span className="text-sm text-gray-600">{instance.location}</span>
                  <span className="text-sm text-gray-600">{instance.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">No instances found for this product.</p>
          )}
        </div>

        {/* Add New Instance Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Add New Instance</h3>
          
          <NumberInput
            title='Base Cost ($)'
            value={instanceData.base_cost}
            onChange={(e) => setInstanceData({...instanceData, base_cost: e.target.value})}
            placeholder="Enter base cost"
            required
          />

          <InputSelect
            title='Location'
            value={instanceData.location}
            options={locations}
            onChange={(e) => setInstanceData({...instanceData, location: e.target.value})}
            required
          />

          <InputSelect
            title='Condition'
            value={instanceData.condition}
            options={selectedProduct.category_id === 4 ? cardConditions : conditions}
            onChange={(e) => setInstanceData({...instanceData, condition: e.target.value})}
            required
          />

          <div className="text-sm text-gray-600">
            <strong>Purchase Date:</strong> {new Date().toLocaleDateString()} (Today)
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setAddInstanceModalOpen(false)}
            className="px-4 py-2 bg-red-600 text-mainRed border border-mainRed rounded-md font-Mulish font-black hover:text-white hover:bg-mainRed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 border rounded-md font-Mulish font-black text-secondaryBlue hover:text-white hover:bg-secondaryBlue"
          >
            Add Instance
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddInstanceModal;