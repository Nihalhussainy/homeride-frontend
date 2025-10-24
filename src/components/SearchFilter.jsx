import React, { useState } from 'react';
import Input from './Input.jsx';
import Button from './Button.jsx';
import './SearchFilter.css';
import { FiSearch } from 'react-icons/fi';
function SearchFilter({ onFilterChange }) {
const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const handleSearch = () => {
    onFilterChange({ origin, destination, date });
  };
  
  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setDate('');
    onFilterChange({ origin: '', destination: '', date: '' });
  };
  return (
    <div className="search-filter-container">
      <div className="search-icon">
        <FiSearch />
      </div>
      <div className="search-inputs">
        <Input
          type="text"
          placeholder="Filter by origin..."
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Filter by destination..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        {/* New date input field */}
        <Input
          type="date"
          placeholder="Select a date..."
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <Button onClick={handleSearch}>Search</Button>
      <Button onClick={handleReset} className="secondary">Reset</Button>
    </div>
  );
}
export default SearchFilter; 