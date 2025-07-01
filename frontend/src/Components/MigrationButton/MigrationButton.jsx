import React, { useState } from 'react';

const MigrationButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleMigration = async () => {
    if (!confirm('This will create ProductInstance records for all existing Products. Continue?')) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/migrate-products-to-instances/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message} - Migrated ${data.migrated_count} products`);
        // Optionally refresh the page or trigger a data reload
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.detail || 'Migration failed'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleMigration}
        disabled={isLoading}
        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
      >
        {isLoading ? 'Migrating...' : 'Migrate Products to Instances'}
      </button>
      {message && (
        <div className={`mt-2 p-2 rounded-md ${
          message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default MigrationButton; 