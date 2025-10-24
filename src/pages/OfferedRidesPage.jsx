import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SimpleRideCard from '../components/SimpleRideCard.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import AutocompleteInput from '../components/AutocompleteInput.jsx';
import { FiSearch } from 'react-icons/fi';
import './ListingPage.css';
import '../App.css';

const RIDES_PER_PAGE = 5;

function OfferedRidesPage() {
    const [allRides, setAllRides] = useState([]);
    const [displayedRides, setDisplayedRides] = useState([]);
    const [visibleCount, setVisibleCount] = useState(RIDES_PER_PAGE);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [originFilter, setOriginFilter] = useState('');
    const [destinationFilter, setDestinationFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://localhost:8080/api/rides', {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { rideType: 'OFFERED' }
            });
            
            const sortedRides = response.data.sort((a, b) => new Date(a.travelDateTime) - new Date(b.travelDateTime));
            setAllRides(sortedRides);

        } catch (err) {
            setError('Failed to fetch rides. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let filtered = [...allRides];

        if (originFilter) {
            filtered = filtered.filter(ride => ride.origin.toLowerCase().includes(originFilter.toLowerCase()));
        }
        if (destinationFilter) {
            filtered = filtered.filter(ride => ride.destination.toLowerCase().includes(destinationFilter.toLowerCase()));
        }
        if (dateFilter) {
            filtered = filtered.filter(ride => ride.travelDateTime.startsWith(dateFilter));
        }

        setDisplayedRides(filtered.slice(0, visibleCount));
    }, [allRides, originFilter, destinationFilter, dateFilter, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + RIDES_PER_PAGE);
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setVisibleCount(RIDES_PER_PAGE);
    };

    return (
        <div className="main-container">
            <header className="page-header">
                <h1>Find a Ride</h1>
                <p className="page-description">Browse rides offered by your colleagues.</p>
            </header>
            
            <form onSubmit={handleFilterSubmit} className="filter-form">
                <AutocompleteInput value={originFilter} onChange={setOriginFilter} placeholder="From..." />
                <AutocompleteInput value={destinationFilter} onChange={setDestinationFilter} placeholder="To..." />
                <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                <Button type="submit"><FiSearch /> Filter</Button>
            </form>

            <div className="ride-list-container">
                {isLoading ? (
                    <p>Loading rides...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : displayedRides.length > 0 ? (
                    <>
                        {displayedRides.map(ride => (
                            <SimpleRideCard key={ride.id} ride={ride} />
                        ))}
                        {displayedRides.length < allRides.filter(ride => 
                            (!originFilter || ride.origin.toLowerCase().includes(originFilter.toLowerCase())) &&
                            (!destinationFilter || ride.destination.toLowerCase().includes(destinationFilter.toLowerCase())) &&
                            (!dateFilter || ride.travelDateTime.startsWith(dateFilter))
                        ).length && (
                             <div className="load-more-container">
                                <Button onClick={handleLoadMore}>Load More</Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="no-results-card">
                        <h3>No Rides Found</h3>
                        <p>Try adjusting your filters or check back later.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OfferedRidesPage;