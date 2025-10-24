import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Input from './Input.jsx';
import { FiMapPin } from 'react-icons/fi';
import './AutocompleteInput.css';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

function AutocompleteInput({ value, onInputChange, onSuggestionSelect, placeholder, searchContext, ...props }) {
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef(null);
    const cache = useRef({}); // NEW: Use a ref to store the cache
    const debouncedValue = useDebounce(value, 300);

    const fetchSuggestions = useCallback(async (query) => {
        // OPTIMIZATION 1: Increase minimum characters to 3
        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        // OPTIMIZATION 2: Check the cache before making an API call
        if (cache.current[query]) {
            setSuggestions(cache.current[query]);
            return; // Use cached results and skip the API call
        }

        setIsSearching(true);
        const searchQuery = searchContext ? `${query}, ${searchContext}` : query;
        try {
            const response = await axios.get(`http://localhost:8080/api/places/autocomplete?query=${searchQuery}`);
            const data = response.data || [];
            
            cache.current[query] = data; // Save the new results to the cache
            setSuggestions(data);

        } catch (error) {
            console.error('Error fetching autocomplete suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, [searchContext]);

    useEffect(() => {
        if (debouncedValue && isFocused) {
            fetchSuggestions(debouncedValue);
        } else if (!isFocused) {
            setSuggestions([]);
        }
    }, [debouncedValue, isFocused, fetchSuggestions]);

    const handleSelect = (suggestion) => {
        onSuggestionSelect(suggestion);
        setSuggestions([]);
        setIsFocused(false);
    };
    
    const handleBlur = () => {
        setTimeout(() => {
            if (wrapperRef.current && document.activeElement !== wrapperRef.current.querySelector('input')) {
                if (suggestions.length > 0) {
                    handleSelect(suggestions[0]);
                }
                setIsFocused(false);
            }
        }, 150);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && suggestions.length > 0) {
            e.preventDefault();
            handleSelect(suggestions[0]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);
    
    return (
        <div className="autocomplete-wrapper" ref={wrapperRef}>
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onInputChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                {...props}
            />
            {isFocused && value.length > 2 && ( // Changed to 2 to show dropdown after 3 chars
                <ul className="suggestions-list">
                    {isSearching ? <li className="loading-item">Searching...</li>
                    : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <li key={index} onMouseDown={() => handleSelect(suggestion)}>
                                <FiMapPin size={16} className="suggestion-icon" />
                                {suggestion}
                            </li>
                        ))
                    ) : ( debouncedValue.length > 2 && <li className="no-results-item">No results found</li> )}
                </ul>
            )}
        </div>
    );
}

export default AutocompleteInput;