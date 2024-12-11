import express from 'express'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node';
import { Client } from "@googlemaps/google-maps-services-js";
import axios from 'axios';
const googleMapsClient = new Client({});

let app = express();

import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// const RAPID_API_KEY = process.env.RAPID_API_KEY;

const defaultData = { travelTrackerData:[] };
const adapter = new JSONFile('db.json');
const db = new Low(adapter, defaultData)

let travelData = [];

app.get('/', async (req, res, next) => {
    // Clear the database when accessing the main page
    db.data.travelTrackerData = [];
    await db.write();
    res.sendFile('index.html', { root: './public' });
});

// Serve other static files without clearing the database
app.use(express.static('public'));

app.use(express.json());

app.get('/config', (req, res) => {
    res.json({ googleApiKey: process.env.GOOGLE_API_KEY });
});

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}

app.post('/activity', async (req, res) => {
    // console.log(req.body);
    let trips = req.body;
    
    for (const trip of trips) {
        const { origin, destination, startDate, endDate, transportMode, tripType } = trip;
        if (origin && destination && startDate && endDate && transportMode && tripType) { 
            try {
                // Get coordinates for destination (for all transport modes)
                const destGeocode = await googleMapsClient.geocode({
                    params: {
                        address: destination,
                        key: GOOGLE_API_KEY
                    }
                });

                if (destGeocode.data.results[0]) {
                    // Store destination coordinates for all trips
                    trip.destinationLat = destGeocode.data.results[0].geometry.location.lat;
                    trip.destinationLng = destGeocode.data.results[0].geometry.location.lng;
                }

                // Skip Distance Matrix API for plane trips
                if (transportMode.toLowerCase() === 'plane') {
                    // Get coordinates for origin (already have destination)
                    const originGeocode = await googleMapsClient.geocode({
                        params: {
                            address: origin,
                            key: GOOGLE_API_KEY
                        }
                    });

                    if (originGeocode.data.results[0] && destGeocode.data.results[0]) {
                        const originLat = originGeocode.data.results[0].geometry.location.lat;
                        const originLng = originGeocode.data.results[0].geometry.location.lng;
                        const destLat = trip.destinationLat;
                        const destLng = trip.destinationLng;

                        const distanceKm = calculateHaversineDistance(originLat, originLng, destLat, destLng);
                        const distanceValue = Math.round(distanceKm * 1000); // Convert to meters
                        const distance = `${Math.round(distanceKm)} km`;
                        
                        // Calculate duration for plane trips
                        const speedKmH = 800; // Average commercial flight speed
                        const flightHours = distanceKm / speedKmH;
                        const totalHours = flightHours;
                        
                        const durationValue = Math.round(totalHours * 3600); // Convert to seconds
                        const duration = `${Math.floor(totalHours)} hours ${Math.round((totalHours % 1) * 60)} minutes`;

                        trip.distance = distance;
                        trip.duration = duration;
                        trip.distanceValue = distanceValue;
                        trip.durationValue = durationValue;
                        trip.isApproximation = true;

                        if (tripType.toLowerCase() === 'round-trip') {
                            trip.distanceValue *= 2;
                            trip.durationValue *= 2;
                            trip.distance = `${Math.round(distanceKm * 2)} km`;
                            const totalRoundTripHours = totalHours * 2;
                            trip.duration = `${Math.floor(totalRoundTripHours)} hours ${Math.round((totalRoundTripHours % 1) * 60)} minutes`;
                        }

                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const tripLengthMs = end - start;
                        const tripLengthDays = Math.ceil(tripLengthMs / (1000 * 60 * 60 * 24));
                        trip.tripLength = tripLengthDays;

                        db.data.travelTrackerData.push(trip);
                        continue;
                    }
                }

                // Use Distance Matrix API for non-plane trips
                let response = await googleMapsClient.distancematrix({
                    params: {
                        origins: [origin],
                        destinations: [destination],
                        mode: transportMode,
                        key: GOOGLE_API_KEY
                    }
                });

                let element = response.data.rows[0].elements[0];
                
                if (element.status === 'OK') {
                    let distance = element.distance.text;
                    let duration = element.duration.text;
                    let distanceValue = element.distance.value;
                    let durationValue = element.duration.value;

                    if (tripType.toLowerCase() === 'round-trip') {
                        distanceValue *= 2;
                        durationValue *= 2;
                        distance = distance.replace(/([0-9,.]+)/, (match) => (parseFloat(match) * 2));
                        duration = duration.replace(/([0-9,.]+)/, (match) => (parseFloat(match) * 2));
                    }

                    trip.distance = distance;
                    trip.duration = duration;
                    trip.distanceValue = distanceValue;
                    trip.durationValue = durationValue;

                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const tripLengthMs = end - start;
                    const tripLengthDays = Math.ceil(tripLengthMs / (1000 * 60 * 60 * 24));
                    trip.tripLength = tripLengthDays;

                    db.data.travelTrackerData.push(trip);
                }

            } catch (error) {
                console.error('Error calculating distance:', error);
            }
        } else {
            console.error('Invalid trip data:', trip);
        }
    }

    await db.write();
    res.json({ task: "successful" });
});

app.get('/api/travel-data', async (req, res) => {
    await db.read(); // Make sure we have the latest data
    res.json(db.data.travelTrackerData);
});

// app.listen(3000, ()=>{
//     console.log('listening at localhost:3000');
// });

let port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log('listening at localhost:' + port);
});