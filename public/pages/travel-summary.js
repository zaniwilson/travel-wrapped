// console.log("document is ready");

// At the top of your file with other constants
const PROFILE_IMAGES = {
    'Weekend Wanderer': 'icons/weekend.jpg',
    'Heavy Packer': 'icons/packer.jpg',
    'Jet Setter': 'icons/jetsetter.jpg',
    'Eco Warrior': 'icons/ecowarrior.jpg',
    'Road Tripper': 'icons/roadtripper.jpg',
    'Local Explorer': 'icons/local.jpg',
    'Mile Collector': 'icons/milecollector.jpg'
};

fetch('/api/travel-data')
    .then(response => response.json())
    .then(data => {
        // console.log('Loaded data:', data); // Commented out data verification
        totalDistance(data);
        travelMode(data);
        createWorldMap(data);
        calculateTravelDays(data);
        travelProfile(data);
    })
    .catch(error => {
        console.error('Error loading the data:', error);
    });

// Set up the Intersection Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.65
});

// Observe all sections that should animate
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll(`
        section.world-map,
        #travel-summary,
        #travel-mode,
        #days-away-section,
        #travel-profile
    `);
    
    sections.forEach(section => {
        observer.observe(section);
    });
});

function totalDistance(distanceData) {
    let total = 0;
    for (let trip of distanceData) {
        total += trip.distanceValue;
    }
    
    // Convert from meters to kilometers
    const kilometers = Math.floor((total / 1000));
    const readableDistance = `${kilometers} km`;
    
    // console.log(readableDistance);  // Commented out distance logging
    let kmTraveled = document.getElementById('km-traveled');
    kmTraveled.innerHTML = readableDistance;
    
    let earthCircumference = 40075;
    let percentage = (kilometers / earthCircumference) * 100;
    let percentageTraveled = `${percentage.toFixed(2)}%`;
    let percentageTraveledElement = document.getElementById('percentage-traveled');
    percentageTraveledElement.innerHTML = percentageTraveled;

}

function travelMode(modeData) {
    // Count occurrences of each transport mode
    const modeCount = modeData.reduce((acc, trip) => {
        acc[trip.transportMode] = (acc[trip.transportMode] || 0) + 1;
        return acc;
    }, {});
    
    // Find the mode with highest count
    const mostCommonMode = Object.entries(modeCount)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    let travelMode = document.getElementById('preferred-mode');
    travelMode.innerHTML = mostCommonMode.charAt(0).toUpperCase() + mostCommonMode.slice(1).toLowerCase();

    let tripTypes = document.getElementById('trip-types');
    
    // Group the transport modes
    const groupedModes = modeData.reduce((acc, trip) => {
        let category = trip.transportMode.toLowerCase();
        if (category === 'car' || category === 'bus') {
            category = 'road trips';
        } else if (category === 'plane') {
            category = 'flights';
        } else if (category === 'train') {
            category = 'train journeys';
        }
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    // Create D3 visualization
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select('#trip-types')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = Object.entries(groupedModes).map(([key, value]) => ({
        mode: key,
        count: value
    }));

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0]);

    x.domain(data.map(d => d.mode));
    y.domain([0, d3.max(data, d => d.count)]);

    // Add bars
    svg.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.mode))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.count))
        .attr('height', d => height - y(d.count))
        .style('fill', '#311f26');

    // Add x axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-45)');

    // Add y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(d3.max(data, d => d.count)));
}

function calculateTravelDays(travelData) {
    // Calculate total days away using tripLength
    const daysAway = travelData.reduce((total, trip) => {
        return total + trip.tripLength;
    }, 0);
    
    // Calculate percentage of year
    const daysInYear = 365;
    const percentage = ((daysAway / daysInYear) * 100).toFixed(1);
    
    // Update DOM elements
    document.getElementById('days-away').innerHTML = `${daysAway}`;
    
    // Create pie chart
    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;
    
    const svg = d3.select('#days-away-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);
    
    const data = [
        { label: 'Days Away', value: daysAway },
        { label: 'Days Home', value: daysInYear - daysAway }
    ];
    
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.label))
        .range(['#311f26', '#E0E0E0']);
    
    const pie = d3.pie()
        .value(d => d.value);
    
    const arc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius);
    
    const arcs = svg.selectAll('arc')
        .data(pie(data))
        .enter()
        .append('g');
    
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.label));
    
    // Add percentage label in the center
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '24px')
        .text(`${percentage}%`);
}

function createWorldMap(travelData) {
    // Check if we have data
    if (!travelData || !Array.isArray(travelData) || travelData.length === 0) {
        console.error('No travel data available');
        return;
    }

    const width = 960;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };

    // Check if container exists
    const container = d3.select('#world-map');
    if (container.empty()) {
        console.error('World map container not found');
        return;
    }

    // Create SVG
    const svg = container
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create projection and path
    const projection = d3.geoMercator()
        .scale(140)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Load world map data with error handling
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        .then(worldData => {
            if (!worldData || !worldData.features) {
                throw new Error('Invalid world map data');
            }

            // Draw the map
            svg.selectAll('path.country')
                .data(worldData.features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .style('fill', '#ccc')
                .style('stroke', '#fff')
                .style('stroke-width', '0.5');

            // Create timeline container
            const timelineContainer = svg.append('g')
                .attr('class', 'timeline')
                .attr('transform', `translate(0, ${height - margin.bottom})`);

            const startDate = new Date('2024-01-01');
            const endDate = new Date();
            
            // Create time scale
            const timeScale = d3.scaleTime()
                .domain([startDate, endDate])
                .range([margin.left, width - margin.right]);

            // Create slider
            let currentValue = startDate;
            const slider = timelineContainer.append('g')
                .attr('class', 'slider');

            // Add track
            slider.append('line')
                .attr('class', 'track')
                .attr('x1', timeScale.range()[0])
                .attr('x2', timeScale.range()[1])
                .style('stroke', '#ccc')
                .style('stroke-width', 10);

            // Add handle
            const handle = slider.append('circle')
                .attr('class', 'handle')
                .attr('r', 8)
                .attr('cx', timeScale(startDate))
                .style('fill', '#fff')
                .style('stroke', '#000')
                .style('stroke-width', 2)
                .call(d3.drag()
                    .on('drag', dragged));

            // Add axis
            timelineContainer.append('g')
                .call(d3.axisBottom(timeScale));

            // Process and validate travel data
            const locations = travelData
                .filter(trip => {
                    // Validate required data
                    if (!trip.destinationLat || !trip.destinationLng || !trip.startDate) {
                        console.warn('Invalid trip data:', trip);
                        return false;
                    }
                    return true;
                })
                .map(trip => ({
                    coords: [trip.destinationLng, trip.destinationLat],
                    date: new Date(trip.startDate)
                }))
                .sort((a, b) => a.date - b.date);

            if (locations.length === 0) {
                console.error('No valid location data to display');
                return;
            }

            // Create points for all locations (initially invisible)
            const points = svg.selectAll('.location')
                .data(locations)
                .enter()
                .append('circle')
                .attr('class', 'location')
                .attr('cx', d => projection(d.coords)[0])
                .attr('cy', d => projection(d.coords)[1])
                .attr('r', 5)
                .style('fill', '#ff4444')
                .style('opacity', 0);

            function dragged(event) {
                const x = Math.max(timeScale.range()[0], 
                    Math.min(timeScale.range()[1], event.x));
                handle.attr('cx', x);
                currentValue = timeScale.invert(x);
                updatePoints(currentValue);
            }

            function updatePoints(date) {
                points.style('opacity', d => d.date <= date ? 0.7 : 0);
            }

            // Add play button
            const playButton = container
                .append('button')
                .text('Play')
                .style('position', 'absolute')
                .style('bottom', '20px')
                .style('left', '20px')
                .style('background-color', '#e24846')
                .style('color', 'white')
                .style('border', 'none')
                .style('padding', '10px 20px')
                .style('border-radius', '5px')
                .style('cursor', 'pointer')
                .style('z-index', '10');

            let playing = false;
            let timer;

            playButton.on('click', () => {
                if (playing) {
                    clearInterval(timer);
                    playButton.text('Play');
                } else {
                    timer = setInterval(() => {
                        currentValue = new Date(currentValue.getTime() + (86400000 * 3));
                        if (currentValue > endDate) {
                            clearInterval(timer);
                            playButton.text('Play');
                            playing = false;
                            return;
                        }
                        handle.attr('cx', timeScale(currentValue));
                        updatePoints(currentValue);
                    }, 50);
                    playButton.text('Pause');
                }
                playing = !playing;
            });

        })
        .catch(error => {
            console.error('Error loading world map data:', error);
            container.append('div')
                .attr('class', 'error-message')
                .text('Failed to load map data. Please try again later.');
        });
}

// Helper function to validate coordinates
function isValidCoordinate(coords) {
    return coords 
        && typeof coords.lat === 'number' 
        && typeof coords.lng === 'number'
        && coords.lat >= -90 
        && coords.lat <= 90
        && coords.lng >= -180 
        && coords.lng <= 180;
}

function travelProfile(travelData) {
    const profiles = [];
    
    // Calculate average trip length
    const avgTripLength = travelData.reduce((sum, trip) => sum + trip.tripLength, 0) / travelData.length;
    if (avgTripLength <= 4) {
        profiles.push('Weekend Wanderer');
    } else {
        profiles.push('Heavy Packer');
    }
    
    // Calculate most frequent mode of transport
    const modeCount = travelData.reduce((acc, trip) => {
        acc[trip.transportMode] = (acc[trip.transportMode] || 0) + 1;
        return acc;
    }, {});
    
    const mostCommonMode = Object.entries(modeCount)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0].toLowerCase();
    
    if (mostCommonMode === 'plane') {
        profiles.push('Jet Setter');
    } else if (['bus', 'train'].includes(mostCommonMode)) {
        profiles.push('Eco Warrior');
    } else if (mostCommonMode === 'car') {
        profiles.push('Road Tripper');
    }
    
    // Calculate total distance
    const totalKm = travelData.reduce((sum, trip) => sum + trip.distanceValue, 0) / 1000;
    if (totalKm <= 25000) {
        profiles.push('Local Explorer');
    } else {
        profiles.push('Mile Collector');
    }
    
    // Update DOM elements
    const profileHeading = document.getElementById('travel-profile-heading');
    const profileText = document.getElementById('travel-profile-text');
    
    profileHeading.innerHTML = profiles.join(' • ');
    profileText.innerHTML = `Based on your travel data, you're a ${profiles.join(', and ')}! ` +
        `Your average trip length is ${avgTripLength.toFixed(1)} days, ` +
        `you prefer traveling by ${mostCommonMode}, ` +
        `and you've covered ${Math.floor(totalKm)} kilometers.`;

    // Update profile images
    const [lengthProfile, modeProfile, distanceProfile] = profiles;
    
    document.getElementById('length-profile').innerHTML = `
        <img src="${PROFILE_IMAGES[lengthProfile]}" alt="${lengthProfile}" />
    `;
    
    document.getElementById('mode-profile').innerHTML = `
        <img src="${PROFILE_IMAGES[modeProfile]}" alt="${modeProfile}" />
    `;
    
    document.getElementById('distance-profile').innerHTML = `
        <img src="${PROFILE_IMAGES[distanceProfile]}" alt="${distanceProfile}" />
    `;
}