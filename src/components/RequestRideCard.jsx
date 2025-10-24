// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaUserCircle } from 'react-icons/fa';
// import { FiClock, FiUsers, FiMapPin } from 'react-icons/fi';
// import Button from './Button.jsx';
// import './RequestRideCard.css';

// function RequestRideCard({ ride, onActionSuccess }) {
//     const navigate = useNavigate();

//     const handleViewProfile = (e) => {
//         e.stopPropagation();
//         // In a real app, you might open a modal or navigate to a profile page
//         console.log("Viewing profile for:", ride.requester.name);
//     };

//     const handleAccept = (e) => {
//         e.stopPropagation();
//         // Here you would call the API to accept the ride
//         console.log("Accepting ride:", ride.id);
//         onActionSuccess(); // To refresh the list
//     };

//     return (
//         <div className="request-ride-card" onClick={() => navigate(`/ride/${ride.id}`)}>
//             <div className="request-card-header">
//                 <div className="request-route">
//                     <FiMapPin/> {ride.origin} &rarr; {ride.destination}
//                 </div>
//             </div>
//             <div className="request-card-body">
//                 <div className="requester-info" onClick={handleViewProfile}>
//                     {ride.requester.profilePictureUrl ? (
//                         <img src={ride.requester.profilePictureUrl} alt={ride.requester.name} className="requester-avatar"/>
//                     ) : (
//                         <FaUserCircle className="requester-avatar-placeholder"/>
//                     )}
//                     <div className="requester-details">
//                         <span className="requester-name">{ride.requester.name}</span>
//                         <span className="requester-meta">Requests a ride</span>
//                     </div>
//                 </div>
//                 <div className="request-time-info">
//                     <FiClock/>
//                     <span>{new Date(ride.travelDateTime).toLocaleDateString()}</span>
//                     <span>{new Date(ride.travelDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
//                 </div>
//             </div>
//             <div className="request-card-footer">
//                 <div className="request-meta">
//                     <FiUsers/> 1 Passenger
//                 </div>
//                 <Button onClick={handleAccept} className="accept-button">
//                     Offer to Drive
//                 </Button>
//             </div>
//         </div>
//     );
// }

// export default RequestRideCard;

