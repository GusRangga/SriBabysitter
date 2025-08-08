// Baby Sitter Booking System JavaScript

// Initialize bookings from localStorage or empty array
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];

// DOM Elements
const bookingForm = document.getElementById('bookingForm');
const bookingList = document.getElementById('bookingList');
const totalBookings = document.getElementById('totalBookings');
const totalSuccess = document.getElementById('totalSuccess');
const pendingBookings = document.getElementById('pendingBookings');
const numKidsSelect = document.getElementById('numKids');
const childrenContainer = document.getElementById('childrenContainer');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    displayBookings();
    updateStats();
    
    // Add event listener for form submission
    bookingForm.addEventListener('submit', handleBookingSubmit);
    
    // Add event listener for number of kids change
    numKidsSelect.addEventListener('change', handleNumKidsChange);
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').setAttribute('min', today);
    document.getElementById('endDate').setAttribute('min', today);
});

// Handle number of kids change
function handleNumKidsChange() {
    const numKids = parseInt(numKidsSelect.value) || 0;
    generateChildFields(numKids);
}

// Generate dynamic child fields
function generateChildFields(numKids) {
    childrenContainer.innerHTML = '';
    
    for (let i = 1; i <= numKids; i++) {
        const childGroup = document.createElement('div');
        childGroup.className = 'child-group';
        childGroup.innerHTML = `
            <h4>Child ${i}</h4>
            <div class="form-group">
                <label for="childName${i}">Child ${i}'s Name</label>
                <input type="text" id="childName${i}" name="childName${i}" required>
            </div>
            <div class="form-group">
                <label for="childAge${i}">Child ${i}'s Age</label>
                <input type="number" id="childAge${i}" name="childAge${i}" min="0" max="12" required>
            </div>
        `;
        childrenContainer.appendChild(childGroup);
    }
}

// Handle booking form submission
function handleBookingSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(bookingForm);
    const numKids = parseInt(formData.get('numKids')) || 1;
    
    // Collect children data
    const children = [];
    for (let i = 1; i <= numKids; i++) {
        children.push({
            name: formData.get(`childName${i}`),
            age: formData.get(`childAge${i}`)
        });
    }
    
    const booking = {
        id: Date.now(),
        guestName: formData.get('guestName'),
        children: children,
        numKids: numKids,
        location: formData.get('location'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate') || formData.get('startDate'),
        specialRequests: formData.get('specialRequests') || '',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // Get hours per day
    const hoursPerDay = parseInt(formData.get('hoursPerDay')) || 5;
    
    // Calculate price per hour based on number of kids
    const pricePerHourMap = {
        '1': 90000,
        '2': 120000,
        '3': 150000
    };
    const pricePerHour = pricePerHourMap[booking.numKids] || 0;
    
    // Calculate travel fee based on location (per day)
    const travelFeeMap = {
        'standard': 100000,
        'uluwatu': 150000,
        'ubud': 150000
    };
    const travelFee = travelFeeMap[booking.location] || 0;
    
    // Calculate number of days from start and end date
    const startDate = new Date(formData.get('startDate'));
    const endDate = new Date(formData.get('endDate') || formData.get('startDate'));
    const numDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate total price
    booking.price = (pricePerHour * hoursPerDay * numDays) + (travelFee * numDays);
    
    // Add the hours per day field to booking object
    booking.hoursPerDay = hoursPerDay;
    booking.numDays = numDays;
    
    // Add booking to array
    bookings.unshift(booking);
    
    // Save to localStorage
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // Reset form
    bookingForm.reset();
    childrenContainer.innerHTML = '';
    
    // Update UI
    displayBookings();
    updateStats();
    
    // Show success message
    showNotification('Booking added successfully!', 'success');
}

// Display all bookings
function displayBookings() {
    if (bookings.length === 0) {
        bookingList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No bookings yet</h3>
                <p>Add your first booking using the form above</p>
            </div>
        `;
        return;
    }
    
    bookingList.innerHTML = bookings.map(booking => {
        const childrenInfo = booking.children.map((child, index) => 
            `Child ${index + 1}: ${child.name} (${child.age} years old)`
        ).join('<br>');
        
        const dateRange = booking.startDate === booking.endDate 
            ? formatDate(booking.startDate)
            : `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`;
        
        return `
            <div class="booking-item">
                <div class="booking-info">
                    <h4>${booking.guestName}</h4>
                    <p><strong>Number of Kids:</strong> ${booking.numKids} kids</p>
                    <div style="margin: 5px 0;">
                        <strong>Children Details:</strong><br>
                        ${childrenInfo}
                    </div>
                    <p><strong>Date:</strong> ${dateRange}</p>
                    <p><strong>Hours per Day:</strong> ${booking.hoursPerDay} hours</p>
                    <p><strong>Total Days:</strong> ${booking.numDays} days</p>
                    <p><strong>Total Price:</strong> Rp ${booking.price.toLocaleString()}</p>
                    ${booking.specialRequests ? `<p><strong>Notes:</strong> ${booking.specialRequests}</p>` : ''}
                </div>
                <div>
                    <span class="booking-status status-${booking.status}">${booking.status}</span>
                    ${booking.status === 'pending' ? 
                        `<button class="success-btn" onclick="updateBookingStatus(${booking.id}, 'success')">Mark Success</button>` : 
                        `<button class="pending-btn" onclick="updateBookingStatus(${booking.id}, 'pending')">Mark Pending</button>`
                    }
                    <button class="delete-btn" onclick="deleteBooking(${booking.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    totalBookings.textContent = bookings.length;
    
    const total = bookings.reduce((sum, booking) => sum + booking.price, 0);
    if (totalSuccess) {
        totalSuccess.textContent = bookings.filter(booking => booking.status === 'success').length;
    }
    
    const pending = bookings.filter(booking => booking.status === 'pending').length;
    pendingBookings.textContent = pending;
}

// Delete booking
function deleteBooking(id) {
    if (confirm('Are you sure you want to delete this booking?')) {
        bookings = bookings.filter(booking => booking.id !== id);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        displayBookings();
        updateStats();
        showNotification('Booking deleted successfully!', 'info');
    }
}

// Update booking status
function updateBookingStatus(id, status) {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        booking.status = status;
        localStorage.setItem('bookings', JSON.stringify(bookings));
        displayBookings();
        updateStats();
        showNotification(`Booking ${status}!`, 'success');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.background = '#28a745';
    } else if (type === 'error') {
        notification.style.background = '#dc3545';
    } else {
        notification.style.background = '#17a2b8';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export bookings to CSV
// Function removed as per user request
