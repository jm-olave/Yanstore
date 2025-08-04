import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link, redirect } from "react-router-dom";
import InputSelect from "../Components/SelectInput/InputSelect";
import TextInput from "../Components/TextInput/TextInput";
import DateInput from "../Components/DateInput/DateInput";
import ImageInput from "../Components/ImageInput/ImageInput";
import TextAreaInput from "../Components/TextAreaInput/TextAreaInput";
import NumberInput from "../Components/NumberInput/NumberInput";
import SubmitButton from "../Components/SubmitButton/SubmitButton";
import useApi from "../hooks/useApi";
import useDateUtils from "../hooks/useDate";
import GradientButton from "../Components/GradientButton/GradientButton";
import useExchangeRate from "../hooks/useExchangeRate";

const obtainingMethods = [
  { value: "Select Option", label: "Select Option" },
  { value: "audit", label: "Audit" },
  { value: "purchase", label: "Purchase" },
  { value: "trade", label: "Trade" },
];

const conditions = [
  { value: "Select Option", label: "Select Option" },
  { value: "New", label: "New" },
  { value: "Used", label: "Used" },
  { value: "Damaged", label: "Damaged" },
];

const cardConditions = [
  { value: "Select Option", label: "Select Option" },
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
  { value: "Select Option", label: "Select Option" },
  { value: "Colombia", label: "Colombia" },
  { value: "USA", label: "USA" },
];

const ProductForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Add getCategories to the destructured useApi hook
  const { createProduct, updateProduct, getCategories } = useApi();
  const { formatForApi } = useDateUtils();
  
  // Check for duplicate parameter
  const searchParams = new URLSearchParams(location.search);
  const duplicateId = searchParams.get('duplicate');
  const isEdit = Boolean(id);
  const isDuplicate = Boolean(duplicateId);
  
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    condition: 'New',
    purchase_date: '',
    location: 'Colombia',
    obtained_method: '',
    event_id: '',
    base_costs: ['']
  });
  
  const [originalProduct, setOriginalProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchCategories();
    fetchEvents();
    
    if (isEdit) {
      fetchProduct(id);
    } else if (isDuplicate) {
      fetchProductForDuplication(duplicateId);
    }
  }, [id, duplicateId]);

  const fetchProductForDuplication = async (productId) => {
    try {
      console.log('Fetching product for duplication, productId:', productId);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/${productId}/`
      );
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      
      // Fetch instances using the correct endpoint from main.py
      const instancesResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/instances/`
      );
      let allBaseCosts = [''];
      
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        // Filter instances for this specific product
        const productInstances = instancesData.filter(instance => 
          instance.product_id === parseInt(productId)
        );
        
        if (productInstances.length > 0) {
          const uniqueCosts = [...new Set(productInstances.map(instance => instance.base_cost))];
          allBaseCosts = uniqueCosts.map(cost => cost.toString());
        }
      }
      
      setOriginalProduct(data);
      setFormData({
        ...data,
        name: data.name,
        base_costs: allBaseCosts
      });
    } catch (error) {
      console.error('Error fetching product for duplication:', error);
    }
  };

  const fetchProduct = async (productId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/${productId}`
      );
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      setOriginalProduct(data);
      setFormData({
        ...data,
        base_costs: [data.base_costs[0]]
      });
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/categories`
      );
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories([
        { value: "Select Option", label: "Select Option" },
        ...data.map(cat => ({
          value: cat.category_id.toString(),
          label: cat.category_name
        }))
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/events`
      );
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents([
        { value: "Select Option", label: "Select Option" },
        ...data.map(event => ({
          value: event.event_id.toString(),
          label: event.name
        }))
      ]);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setSubmitStatus({ type: "error", message: "Name is required" });
      return false;
    }
    if (formData.category_id === "Select Option") {
      setSubmitStatus({ type: "error", message: "Please select a category" });
      return false;
    }
    if (formData.condition === "Select Option") {
      setSubmitStatus({ type: "error", message: "Please select a condition" });
      return false;
    }
    if (formData.obtained_method === "Select Option") {
      setSubmitStatus({
        type: "error",
        message: "Please select an obtaining method",
      });
      return false;
    }
    if (formData.location === "Select Option") {
      setSubmitStatus({ type: "error", message: "Please select a location" });
      return false;
    }
    if (!formData.purchase_date) {
      setSubmitStatus({ type: "error", message: "Purchase date is required" });
      return false;
    }

    // Validate base costs
    if (!formData.base_costs || formData.base_costs.length === 0 || !formData.base_costs[0].trim()) {
      setSubmitStatus({
        type: "error",
        message: "Base cost is required",
      });
      return false;
    }
    
    // Check if at least one base cost has a valid value
    const hasValidBaseCost = formData.base_costs.some(cost => cost && cost.trim() && !isNaN(parseFloat(cost)) && parseFloat(cost) > 0);
    if (!hasValidBaseCost) {
      setSubmitStatus({
        type: "error",
        message: "At least one valid base cost is required",
      });
      return false;
    }
    if (formData.shipment_cost && parseFloat(formData.shipment_cost) < 0) {
      setSubmitStatus({
        type: "error",
        message: "Shipment cost cannot be negative",
      });
      return false;
    }

    // Additional validation to ensure the date is not in the future
    const selectedDate = new Date(formData.purchase_date);
    const currentDate = new Date();

    if (selectedDate > currentDate) {
      setSubmitStatus({
        type: "error",
        message: "Purchase date cannot be in the future",
      });
      return false;
    }

    return true;
  };

  const submitForm = async () => {
    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: "", message: "" });

      const categoryId = parseInt(formData.category_id, 10);
      if (isNaN(categoryId)) {
        throw new Error("Invalid category ID");
      }

      const dateValue = formatForApi(formData.purchase_date);

      if (isEdit) {
        const updateData = {
          name: formData.name,
          category_id: categoryId,
          condition: formData.condition,
          obtained_method: formData.obtained_method.toLowerCase(),
          event_id: formData.event_id !== "Select Option" ? parseInt(formData.event_id, 10) : null,
          location: formData.location,
          purchase_date: dateValue,
          description: formData.description,
        };

        console.log("Updating product with data:", updateData);
        await updateProduct(id, updateData);

        setSubmitStatus({
          type: "success",
          message: "Product successfully updated!",
        });

        navigate('/inventory')
      } else {
        // Create new product using the hook
        const formData = new FormData();

        // Add all required fields
        formData.append("name", formData.name);
        formData.append("category_id", categoryId);
        formData.append("condition", formData.condition);
        formData.append("obtained_method", formData.obtained_method.toLowerCase());
        formData.append("purchase_date", dateValue);

        // Add optional fields
        if (formData.location && formData.location !== "Select Option") {
          formData.append("location", formData.location);
        }

        if (formData.event_id && formData.event_id !== "Select Option") {
          formData.append("event_id", formData.event_id);
        }

        if (formData.description) {
          formData.append("description", formData.description);
        }

        formData.base_costs.forEach((cost) => {
          formData.append("base_costs", cost);
        });

        if (formData.image) {
          formData.append("image", formData.image);
        }

        const newProduct = await createProduct(formData);

        setSubmitStatus({
          type: "success",
          message: "Product and pricing successfully added!",
        });

        // Reset form after successful submission (only in create mode)
        setFormData({
          name: "",
          category_id: "Select Option",
          condition: "Select Option",
          obtained_method: "Select Option",
          purchase_date: "",
          location: "Select Option",
          image: null,
          description: "",
          base_costs: [""]
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: `Failed to ${isEdit ? "update" : "submit"} form: ${
          error.message
        }`,
      });
      console.error("API Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleBaseCostChange = (index, value) => {
    const newBaseCosts = [...formData.base_costs];
    newBaseCosts[index] = value;
    setFormData((prev) => ({ ...prev, base_costs: newBaseCosts }));
  };

  const addBaseCostInput = () => {
    setFormData((prev) => ({ ...prev, base_costs: [...prev.base_costs, ""] }));
  };

  const removeBaseCostInput = (index) => {
    const newBaseCosts = [...formData.base_costs];
    newBaseCosts.splice(index, 1);
    setFormData((prev) => ({ ...prev, base_costs: newBaseCosts }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      await submitForm();
    }
  };

  // Fetch categories using the API hook
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();

        const mappedCategories = [
          { value: "Select Option", label: "Select Option" },
          ...data.map((cat) => ({
            value: cat.category_id.toString(),
            label: cat.category_name,
          })),
        ];
        setCategories(mappedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [getCategories]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/events/`);
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();

        const mappedEvents = [
          { value: "Select Option", label: "Select Option" },
          ...data.map((event) => ({
            value: event.event_id.toString(),
            label: event.name,
          })),
        ];
        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="w-11/12 mx-auto lg:max-w-7xl">
      {submitStatus.message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            submitStatus.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <form className="lg:grid lg:grid-cols-3 lg:gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col">
          <TextInput
            name="name"
            title="Name"
            placeholder="Name"
            value={formData.name}
            onChange={handleFormChange}
            required
          />
          <InputSelect
            name="location"
            title="Location"
            value={formData.location}
            options={locations}
            onChange={handleFormChange}
            required
          />
          {formData.base_costs.map((cost, index) => (
            <div key={index} className="flex items-center">
              <NumberInput
                name={`base_cost_${index}`}
                title={index === 0 ? "Base Cost" : ""}
                value={cost}
                onChange={(e) => handleBaseCostChange(index, e.target.value)}
                required
              />
              {formData.base_costs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBaseCostInput(index)}
                  className="ml-2 text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addBaseCostInput} className="text-secondaryBlue">
            + Add Another Cost
          </button>
          <ImageInput
            name="image"
            title="Image"
            onChange={handleFormChange}
          />
        </div>

        <div className="flex flex-col">
          <InputSelect
            name="category_id"
            title="Categories"
            value={formData.category_id}
            options={categories}
            onChange={handleFormChange}
            required
          />
          <InputSelect
            name="obtained_method"
            title="Obtaining Method"
            value={formData.obtained_method}
            options={obtainingMethods}
            onChange={handleFormChange}
            required
          />
          <InputSelect
            name="event_id"
            title="Event"
            value={formData.event_id}
            options={events}
            onChange={handleFormChange}
          />

            <NumberInput
              name="shipment_cost"
              title="Shipment Cost"
              value={formData.shipment_cost}
              onChange={handleFormChange}
            />
            {formData.shipment_cost && !isNaN(parseFloat(formData.shipment_cost)) && (
              <div className="text-center font-Josefin font-semibold text-sm text-secondaryBlue">
                {exchangeRateLoading
                  ? "Loading..."
                  : convertToCOP(formData.shipment_cost)}
              </div>
            )}
        </div>

        <div className="flex flex-col">
          <InputSelect
            name="condition"
            title="Condition"
            value={formData.condition}
            options={formData.category_id === "4" ? cardConditions : conditions}
            onChange={handleFormChange}
            required
          />

          <DateInput
            name="purchase_date"
            title="Purchase Date"
            value={formData.purchase_date}
            onChange={(e) => {
              handleFormChange({
                target: {
                  name: "purchase_date",
                  value: e.target.value,
                },
              });
            }}
            max={today}
            required
          />
          
          
        </div>

        

        <div className="lg:col-span-3">
          <TextAreaInput
            name="description"
            title="Notes"
            placeholder="Notes"
            value={formData.description}
            onChange={handleFormChange}
          />
        </div>

        <div className="col-start-2">
          <SubmitButton/>
        </div>

        <div className="col-start-3">
          <button className="w-full p-3 font-Mulish font-black text-white text-xl border bg-gradient-radial from-secondaryBlue to-mainBlue md:max-w-15 lg:max-w-sm">
              <Link to="/inventory">Go to Inventory</Link>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;















