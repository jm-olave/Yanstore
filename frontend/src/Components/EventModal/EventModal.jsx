import React, { useState, useEffect } from 'react';
import TextInput from '../TextInput/TextInput';
import DateInput from '../DateInput/DateInput';
import TextAreaInput from '../TextAreaInput/TextAreaInput';
import NumberInput from '../NumberInput/NumberInput';
import InputSelect from '../SelectInput/InputSelect';
import SubmitButton from '../SubmitButton/SubmitButton';

const countries = [
  { value: "Select Option", label: "Select Option" },
  { value: "Colombia", label: "Colombia" },
  { value: "USA", label: "USA" },
  { value: "Mexico", label: "Mexico" },
  { value: "Brazil", label: "Brazil" },
  { value: "Argentina", label: "Argentina" },
  { value: "Chile", label: "Chile" },
  { value: "Peru", label: "Peru" },
  { value: "Ecuador", label: "Ecuador" },
  { value: "Venezuela", label: "Venezuela" },
  { value: "Other", label: "Other" }
];

const EventModal = ({ isOpen, onClose, onSubmit, event = null, isEditMode = false }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    country: "Select Option",
    start_date: "",
    end_date: "",
    initial_budget: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });

  const today = new Date().toISOString().split("T")[0];

  // Load event data if editing
  useEffect(() => {
    if (event && isEditMode) {
      setForm({
        name: event.name,
        description: event.description || "",
        country: event.country,
        start_date: event.start_date,
        end_date: event.end_date,
        initial_budget: event.initial_budget.toString()
      });
    } else {
      resetForm();
    }
  }, [event, isEditMode]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      country: "Select Option",
      start_date: "",
      end_date: "",
      initial_budget: ""
    });
    setSubmitStatus({ type: "", message: "" });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setSubmitStatus({ type: "error", message: "Event name is required" });
      return false;
    }
    if (form.country === "Select Option") {
      setSubmitStatus({ type: "error", message: "Please select a country" });
      return false;
    }
    if (!form.start_date) {
      setSubmitStatus({ type: "error", message: "Start date is required" });
      return false;
    }
    if (!form.end_date) {
      setSubmitStatus({ type: "error", message: "End date is required" });
      return false;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setSubmitStatus({ type: "error", message: "End date must be after start date" });
      return false;
    }
    if (!form.initial_budget || parseFloat(form.initial_budget) <= 0) {
      setSubmitStatus({ type: "error", message: "Initial budget must be greater than 0" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const eventData = {
        name: form.name,
        description: form.description || null,
        country: form.country,
        start_date: form.start_date,
        end_date: form.end_date,
        initial_budget: parseFloat(form.initial_budget),
        travel_expenses: 0 // Default value
      };

      await onSubmit(eventData, isEditMode ? event.event_id : null);
      resetForm();
      onClose();
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: `Failed to ${isEditMode ? 'update' : 'create'} event: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isEditMode ? "Edit Event" : "Create New Event"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              name="name"
              title="Event Name"
              placeholder="Event Name"
              value={form.name}
              onChange={handleFormChange}
              required
            />
            <InputSelect
              name="country"
              title="Country"
              value={form.country}
              options={countries}
              onChange={handleFormChange}
              required
            />
            <DateInput
              name="start_date"
              title="Start Date"
              value={form.start_date}
              onChange={handleFormChange}
              max={form.end_date || today}
              required
            />
            <DateInput
              name="end_date"
              title="End Date"
              value={form.end_date}
              onChange={handleFormChange}
              min={form.start_date}
              required
            />
            <NumberInput
              name="initial_budget"
              title="Initial Budget ($)"
              value={form.initial_budget}
              onChange={handleFormChange}
              required
            />
          </div>
          
          <TextAreaInput
            name="description"
            title="Description"
            placeholder="Event description..."
            value={form.description}
            onChange={handleFormChange}
          />

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <SubmitButton disabled={isSubmitting} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal; 