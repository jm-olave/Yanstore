import React, { useState, useEffect } from 'react';
import EventModal from '../Components/EventModal/EventModal';
import TravelExpenseModal from '../Components/TravelExpenseModal/TravelExpenseModal';
import TableRow from '../Components/TableRow/TableRow';
import TableCol from '../Components/TableCol/TableCol';

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
      throw error;
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
      console.log('Calculate budget result:', result);
      
      const calculationText = result.calculation || 'Calculation not available';
      const totalSpent = result.total_spent_on_products || 0;
      const totalTravelExpenses = result.total_travel_expenses || 0;
      
      setSubmitStatus({
        type: "success",
        message: `Budget calculated: ${calculationText}. Total spent on products: $${totalSpent.toFixed(2)}. Total travel expenses: $${totalTravelExpenses.toFixed(2)}`,
      });
      fetchEvents();
    } catch (error) {
      console.error('Calculate budget error:', error);
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
        <h1 className="text-2xl font-bold text-gray-900 text-secondaryBlue">Events</h1>
        <button
          onClick={handleCreateEvent}
          className="bg-secondaryBlue text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Event
        </button>
      </div>

      <div className="bg-white overflow-hidden">
        <div className="overflow-x-auto relative h-full">
          <table className="divide-y divide-gray-200 w-full min-w-[800px]">
            <thead className="bg-gray-50 font-Mulish font-black text-secondaryBlue">
              <TableRow>
                <TableCol text="Event Name" />
                <TableCol text="Country" />
                <TableCol text="Date Range" />
                <TableCol text="Initial Budget" />
                <TableCol text="End Budget" />
                <TableCol text="Actions" />
              </TableRow>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 font-Josefin align-middle">
              {events.map((event) => (
                <TableRow key={event.event_id}>
                  <TableCol>
                    <div className="text-sm font-medium text-gray-900">{event.name}</div>
                    {event.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {event.description}
                      </div>
                    )}
                  </TableCol>
                  <TableCol text={event.country} />
                  <TableCol text={`${formatDate(event.start_date)} - ${formatDate(event.end_date)}`} />
                  <TableCol text={formatCurrency(event.initial_budget)} />
                  <TableCol text={formatCurrency(event.end_budget)} />
                  <TableCol>
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
                  </TableCol>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEvent && eventProducts.length > 0 && (
        <div className="mt-8 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-secondaryBlue">
              Products from {selectedEvent.name}
            </h3>
          </div>
          <div className="overflow-x-auto relative h-full">
            <table className="divide-y divide-gray-200 w-full min-w-[800px]">
              <thead className="bg-gray-50 font-Mulish font-black text-secondaryBlue">
                <TableRow>
                  <TableCol text="Name" />
                  <TableCol text="SKU" />
                  <TableCol text="Condition" />
                  <TableCol text="Location" />
                  <TableCol text="Purchase Date" />
                </TableRow>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 font-Josefin align-middle">
                {eventProducts.map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCol text={product.name} />
                    <TableCol text={product.sku} />
                    <TableCol text={product.condition} />
                    <TableCol text={product.location} />
                    <TableCol text={formatDate(product.purchase_date)} />
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="mt-8 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-secondaryBlue">
              Travel Expenses from {selectedEvent.name}
            </h3>
            <button
              onClick={() => handleCreateTravelExpense(selectedEvent)}
              className="bg-secondaryBlue text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>
          <div className="overflow-x-auto relative h-full">
            <table className="divide-y divide-gray-200 w-full min-w-[800px]">
              <thead className="bg-gray-50 font-Mulish font-black text-secondaryBlue">
                <TableRow>
                  <TableCol text="Name" />
                  <TableCol text="Description" />
                  <TableCol text="Amount" />
                  <TableCol text="Date" />
                  <TableCol text="Receipt" />
                  <TableCol text="Actions" />
                </TableRow>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 font-Josefin align-middle">
                {eventTravelExpenses.length > 0 ? (
                  eventTravelExpenses.map((expense) => (
                    <TableRow key={expense.expense_id}>
                      <TableCol text={expense.name} />
                      <TableCol text={expense.description || '-'} />
                      <TableCol text={formatCurrency(expense.amount)} />
                      <TableCol text={formatDate(expense.expense_date)} />
                      <TableCol>
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
                      </TableCol>
                      <TableCol>
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
                      </TableCol>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCol colSpan="6">
                      No travel expenses found for this event
                    </TableCol>
                  </TableRow>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        event={editingEvent}
        isEditMode={isEditMode}
      />

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