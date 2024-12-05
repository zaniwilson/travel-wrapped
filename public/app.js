window.addEventListener('load', () => {
    const tripContainer = document.getElementById('trip-container');
    const addTripButton = document.getElementById('add-trip');
    const form = document.getElementById('dataForm');

    
    // Add a new trip
    addTripButton.addEventListener('click', () => {
        let fromid = generateRandomString(5)
        let toid = generateRandomString(5)
        const newTrip = document.createElement('div');
        newTrip.classList.add('trip');
        newTrip.innerHTML = `
            <label for="from">From:</label>
            <input id="${fromid}" type="text" name="from" required>
            <label for="to">To:</label>
            <input id="${toid}" type="text" name="to" required>
            <label for="startDate">Start Date:</label>
            <input type="date" name="startdate" required>
            <label for="endDate">End Date:</label>
            <input type="date" name="enddate" required>
            <button type="button" class="remove-trip">Remove Trip</button>
        `;
        tripContainer.appendChild(newTrip);

        let autocomplete;
            autocompleteFrom = new google.maps.places.Autocomplete(
                document.getElementById(fromid),
                {
                    types: ['(cities)'],
                    fields: ['place_id', 'geometry', 'name']
                    
                }
            );
            autocompleteTo = new google.maps.places.Autocomplete(
                document.getElementById(toid),
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
        tripContainer.querySelectorAll('.trip').forEach((trip) => {
            const from = trip.querySelector('input[name="from"]').value;
            const to = trip.querySelector('input[name="to"]').value;
            const startDate = trip.querySelector('input[name="startdate"]').value;
            const endDate = trip.querySelector('input[name="enddate"]').value;

            trips.push({ from, to, startDate, endDate });
        });

        console.log(trips); // For debugging, log all trips to console

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
            console.log(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    });
});


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