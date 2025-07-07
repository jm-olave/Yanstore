import React, { useState, useEffect } from 'react';
import EventModal from '../Components/EventModal/EventModal';
import TravelExpenseModal from '../Components/TravelExpenseModal/TravelExpenseModal';

const Event = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventProducts, setEventProducts] = useState([]);
  const [eventTravelExpenses, setEventTravelExpenses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTravelExpenseModalOpen, setIsTravelExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isExpenseEditMode, setIsExpenseEditMode] = useState(false);

  // API functions
  const createEvent = async (eventData) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/events/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
  };

  const updateEvent = async (eventId, eventData) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    if (!response.ok) throw new Error('Failed to update event');
    return response.json();
  };

  const deleteEvent = async (eventId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete event');
    return response.json();
  };

  const createTravelExpense = async (formData) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/travel-expenses/`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to create travel expense');
    return response.json();
  };

  const updateTravelExpense = async (expenseId, formData) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/travel-expenses/${expenseId}`, {
      method: 'PATCH',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to update travel expense');
    return response.json();
  };

  const deleteTravelExpense = async (expenseId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/travel-expenses/${expenseId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete travel expense');
    return response.json();
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setSubmitStatus({
        type: "error",
        message: `Failed to fetch events: ${error.message}`,
      });
    }
  };

  const fetchEventProducts = async (eventId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/products`);
      if (!response.ok) throw new Error('Failed to fetch event products');
      const data = await response.json();
      setEventProducts(data);
    } catch (error) {
      console.error('Error fetching event products:', error);
    }
  };

  const fetchEventTravelExpenses = async (eventId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/travel-expenses`);
      if (!response.ok) throw new Error('Failed to fetch event travel expenses');
      const data = await response.json();
      setEventTravelExpenses(data);
    } catch (error) {
      console.error('Error fetching event travel expenses:', error);
    }
  };

  const calculateEndBudget = async (eventId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/calculate-end-budget`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to calculate end budget');
      return response.json();
    } catch (error) {
      console.error('Error calculating end budget:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleModalSubmit = async (eventData, eventId = null) => {
    try {
      if (isEditMode && eventId) {
        await updateEvent(eventId, eventData);
        setSubmitStatus({
          type: "success",
          message: "Event updated successfully!",
        });
      } else {
        await createEvent(eventData);
        setSubmitStatus({
          type: "success",
          message: "Event created successfully!",
        });
      }
      fetchEvents();
    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  const handleTravelExpenseSubmit = async (formData, expenseId = null) => {
    try {
      if (isExpenseEditMode && expenseId) {
        await updateTravelExpense(expenseId, formData);
        setSubmitStatus({
          type: "success",
          message: "Travel expense updated successfully!",
        });
      } else {
        await createTravelExpense(formData);
        setSubmitStatus({
          type: "success",
          message: "Travel expense created successfully!",
        });
      }
      if (selectedEvent) {
        await fetchEventTravelExpenses(selectedEvent.event_id);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteEvent(eventId);
      setSubmitStatus({
        type: "success",
        message: "Event deleted successfully!",
      });
      fetchEvents();
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: `Failed to delete event: ${error.message}`,
      });
    }
  };

  const handleCreateTravelExpense = (event) => {
    setEditingExpense(null);
    setIsExpenseEditMode(false);
    setSelectedEvent(event);
    setIsTravelExpenseModalOpen(true);
  };

  const handleEditTravelExpense = (expense) => {
    setEditingExpense(expense);
    setIsExpenseEditMode(true);
    setIsTravelExpenseModalOpen(true);
  };

  const handleDeleteTravelExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this travel expense?")) return;

    try {
      await deleteTravelExpense(expenseId);
      setSubmitStatus({
        type: "success",
        message: "Travel expense deleted successfully!",
      });
      if (selectedEvent) {
        await fetchEventTravelExpenses(selectedEvent.event_id);
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: `Failed to delete travel expense: ${error.message}`,
      });
    }
  };

  const handleViewProducts = async (event) => {
    setSelectedEvent(event);
    await fetchEventProducts(event.event_id);
  };

  const handleViewTravelExpenses = async (event) => {
    setSelectedEvent(event);
    await fetchEventTravelExpenses(event.event_id);
  };

  const handleCalculateBudget = async (eventId) => {
    try {
      const result = await calculateEndBudget(eventId);
      console.log('Calculate budget result:', result); // Debug log
      
      const calculationText = result.calculation || 'Calculation not available';
      const totalSpent = result.total_spent_on_products || 0;
      const totalTravelExpenses = result.total_travel_expenses || 0;
      
      setSubmitStatus({
        type: "success",
        message: `Budget calculated: ${calculationText}. Total spent on products: $${totalSpent.toFixed(2)}. Total travel expenses: $${totalTravelExpenses.toFixed(2)}`,
      });
      fetchEvents(); // Refresh to get updated end_budget
    } catch (error) {
      console.error('Calculate budget error:', error); // Debug log
      setSubmitStatus({
        type: "error",
        message: `Failed to calculate end budget: ${error.message}`,
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <button
          onClick={handleCreateEvent}
          className="bg-secondaryBlue text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Event
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Initial Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.event_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.name}</div>
                    {event.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {event.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(event.start_date)} - {formatDate(event.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(event.initial_budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(event.end_budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewProducts(event)}
                        className="text-green-600 hover:text-green-900"
                      >
                        View Products
                      </button>
                      <button
                        onClick={() => handleViewTravelExpenses(event)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        View Expenses
                      </button>
                      <button
                        onClick={() => handleCalculateBudget(event.event_id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Calculate Budget
                      </button>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.event_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Products Table */}
      {selectedEvent && eventProducts.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Products from {selectedEvent.name}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.condition}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(product.purchase_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Travel Expenses Table */}
      {selectedEvent && (
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Travel Expenses from {selectedEvent.name}
            </h3>
            <button
              onClick={() => handleCreateTravelExpense(selectedEvent)}
              className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
            >
              Add Expense
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventTravelExpenses.length > 0 ? (
                  eventTravelExpenses.map((expense) => (
                    <tr key={expense.expense_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.receipt_type ? (
                          <a
                            href={`${import.meta.env.VITE_API_URL}/travel-expenses/${expense.expense_id}/receipt`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Receipt
                          </a>
                        ) : (
                          'No Receipt'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTravelExpense(expense)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTravelExpense(expense.expense_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No travel expenses found for this event
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        event={editingEvent}
        isEditMode={isEditMode}
      />

      {/* Travel Expense Modal */}
      <TravelExpenseModal
        isOpen={isTravelExpenseModalOpen}
        onClose={() => setIsTravelExpenseModalOpen(false)}
        onSubmit={handleTravelExpenseSubmit}
        expense={editingExpense}
        isEditMode={isExpenseEditMode}
        eventId={selectedEvent?.event_id}
      />
    </div>
  );
};

export default Event; 