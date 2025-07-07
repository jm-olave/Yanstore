import React, { useState, useEffect } from 'react';
import TextInput from '../TextInput/TextInput';
import DateInput from '../DateInput/DateInput';
import TextAreaInput from '../TextAreaInput/TextAreaInput';
import NumberInput from '../NumberInput/NumberInput';
import SubmitButton from '../SubmitButton/SubmitButton';

const TravelExpenseModal = ({ isOpen, onClose, onSubmit, expense = null, isEditMode = false, eventId = null }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    amount: "",
    expense_date: ""
  });

  const [receipt, setReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });

  const today = new Date().toISOString().split("T")[0];

  // Load expense data if editing
  useEffect(() => {
    if (expense && isEditMode) {
      setForm({
        name: expense.name,
        description: expense.description || "",
        amount: expense.amount.toString(),
        expense_date: expense.expense_date
      });
    } else {
      resetForm();
    }
  }, [expense, isEditMode]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      amount: "",
      expense_date: ""
    });
    setReceipt(null);
    setSubmitStatus({ type: "", message: "" });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setSubmitStatus({ type: "error", message: "Expense name is required" });
      return false;
    }
    if (!form.expense_date) {
      setSubmitStatus({ type: "error", message: "Expense date is required" });
      return false;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setSubmitStatus({ type: "error", message: "Amount must be greater than 0" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('event_id', eventId || expense.event_id);
      formData.append('name', form.name);
      formData.append('description', form.description || '');
      formData.append('amount', form.amount);
      formData.append('expense_date', form.expense_date);
      
      if (receipt) {
        formData.append('receipt', receipt);
      }

      await onSubmit(formData, isEditMode ? expense.expense_id : null);
      resetForm();
      onClose();
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: `Failed to ${isEditMode ? 'update' : 'create'} travel expense: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'image/jpeg' || file.type === 'image/png') {
        setReceipt(file);
      } else {
        setSubmitStatus({
          type: "error",
          message: "Only JPG and PNG images are allowed for receipts"
        });
      }
    }
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
            {isEditMode ? "Edit Travel Expense" : "Add Travel Expense"}
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
              title="Expense Name"
              placeholder="e.g., Flight tickets, Hotel, Meals"
              value={form.name}
              onChange={handleFormChange}
              required
            />
            <NumberInput
              name="amount"
              title="Amount ($)"
              value={form.amount}
              onChange={handleFormChange}
              required
            />
            <DateInput
              name="expense_date"
              title="Expense Date"
              value={form.expense_date}
              onChange={handleFormChange}
              max={today}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt (Optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleReceiptChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Only JPG and PNG files are allowed
              </p>
            </div>
          </div>
          
          <TextAreaInput
            name="description"
            title="Description"
            placeholder="Additional details about this expense..."
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

export default TravelExpenseModal; 