window.addEventListener('load', () => {
    const tripContainer = document.getElementById('trip-form');
    const addTripButton = document.getElementById('add-trip');
    const form = document.getElementById('dataForm');

    
    // Add a new trip
    addTripButton.addEventListener('click', () => {
        let orginid = generateRandomString(5)
        let destinationid = generateRandomString(5)
        const newTrip = document.createElement('div');
        newTrip.classList.add('trip');
        newTrip.innerHTML = `
            <label for="origin">From:</label>
            <input id="${orginid}" type="text" name="origin" required>
            <label for="destination">To:</label>
            <input id="${destinationid}" type="text" name="destination" required>
            <label for="startDate">Start Date:</label>
            <input type="date" name="startdate" required>
            <label for="endDate">End Date:</label>
            <input type="date" name="enddate" required>
            <label for="transport-mode">Transport Mode:</label>
            <select id="transport-mode" name="transport-mode" required>
                <option value="car">Car</option>
                <option value="bus">Bus</option>
                <option value="rail">Rail</option>
                <option value="plane">Plane</option>
            </select>
            <select id="trip-type" name="trip-type" required>
                <option value="one-way">One Way</option>
                <option value="round-trip">Round Trip</option>
            </select>
          <button type="button" class="remove-trip">Remove Trip</button>
        `;
        tripContainer.appendChild(newTrip);

        let autocomplete;
            autocompleteOrgin = new google.maps.places.Autocomplete(
                document.getElementById(orginid),
                {
                    types: ['(cities)'],
                    fields: ['place_id', 'geometry', 'name']
                    
                }
            );
            autocompleteDestination = new google.maps.places.Autocomplete(
                document.getElementById(destinationid),
                {
                    types: ['(cities)'],
                    fields: ['place_id', 'geometry', 'name']
                    
                }
            );
    });

    // Remove a trip
    tripContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-trip')) {
            const trips = tripContainer.querySelectorAll('.trip');
            if (trips.length > 1) {
                event.target.parentElement.remove();
            } else {
                alert('You must have at least one trip!');
            }
        }
    });

    // Handle form submission
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const trips = [];
        // Get all trip divs including the first one
        const allTrips = document.querySelectorAll('.trip');
        
        allTrips.forEach((trip) => {
            // Log the trip element to debug
            console.log('Processing trip:', trip);
            
            try {
                const origin = trip.querySelector('[name="origin"]')?.value || trip.querySelector('[name="orgin"]')?.value; // Handle both spellings
                const destination = trip.querySelector('[name="destination"]').value;
                const startDate = trip.querySelector('[name="startdate"]').value;
                const endDate = trip.querySelector('[name="enddate"]').value;
                const transportMode = trip.querySelector('[name="transport-mode"]').value;
                const tripType = trip.querySelector('[name="trip-type"]').value;

                console.log('Collected trip data:', { origin, destination, startDate, endDate, transportMode, tripType });
                
                if (origin && destination && startDate && endDate && transportMode && tripType) {
                    trips.push({ origin, destination, startDate, endDate, transportMode, tripType });
                } else {
                    console.error('Missing data in trip:', { origin, destination, startDate, endDate, transportMode, tripType });
                }
            } catch (error) {
                console.error('Error processing trip:', error);
            }
        });

        if (trips.length > 0) {
            // Send the trips data to the server
            fetch('/activity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trips),
            })
            .then((response) => response.json())
            .then((data) => {
                console.log('Success:', data);
                window.location.href = '/pages/travel-summary.html';
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        } else {
            console.error('No valid trips to submit');
        }
    });
});

fetch('/config')
    .then((response) => response.json())
    .then((config) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleApiKey}&libraries=places&callback=initAutocomplete`;
        script.async = true;
        document.body.appendChild(script);
    })
    .catch((error) => console.error('Error loading API key:', error));


function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  
  console.log(generateRandomString(3));