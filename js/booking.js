// Booking form handling with Google Calendar integration
async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const statusDiv = document.getElementById('booking-status');
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    
    // Clear previous status
    statusDiv.innerHTML = '';
    submitButton.textContent = 'מעבד...';
    submitButton.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            date: formData.get('date'),
            time: formData.get('time'),
            duration: parseFloat(formData.get('duration')),
            timezone: formData.get('timezone'),
            notes: formData.get('notes') || ''
        };
        
        // Validate required fields
        if (!data.name || !data.email || !data.date || !data.time || !data.duration || !data.timezone) {
            throw new Error('אנא מלא את כל השדות הנדרשים');
        }
        
        // Create ISO date strings
        const startDateTime = new Date(`${data.date}T${data.time}`);
        const endDateTime = new Date(startDateTime.getTime() + (data.duration * 60 * 60 * 1000));
        
        const requestBody = {
            name: data.name,
            email: data.email,
            startISO: startDateTime.toISOString(),
            endISO: endDateTime.toISOString(),
            timeZone: data.timezone,
            notes: data.notes
        };
        
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (result.ok) {
            statusDiv.innerHTML = `
                <div style="color: var(--accent); padding: 1rem; background: rgba(31, 182, 194, 0.1); border-radius: 8px; border: 1px solid var(--accent);">
                    <h3>ההזמנה נקלטה בהצלחה!</h3>
                    <p>קיבלת אישור באימייל ואירוע נוסף ליומן שלך.</p>
                    ${result.htmlLink ? `<p><a href="${result.htmlLink}" target="_blank" style="color: var(--accent);">צפה באירוע ביומן Google</a></p>` : ''}
                </div>
            `;
            e.target.reset();
        } else {
            throw new Error(result.error || 'שגיאה לא ידועה');
        }
        
    } catch (error) {
        console.error('Booking error:', error);
        statusDiv.innerHTML = `
            <div style="color: #ff6b6b; padding: 1rem; background: rgba(255, 107, 107, 0.1); border-radius: 8px; border: 1px solid #ff6b6b;">
                <h3>שגיאה בהזמנה</h3>
                <p>${error.message}</p>
            </div>
        `;
    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

// Set minimum date to today
function setMinDate() {
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
}

// Initialize booking form when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.querySelector('#booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
        setMinDate();
    }
});

// Remove header emojis as requested
(function stripHeaderEmojis(){
    const rx = /[\p{Extended_Pictographic}\uFE0F]/gu;
    document.querySelectorAll('h1, h2, h3').forEach(h => {
        h.textContent = h.textContent.replace(rx, '').trim();
    });
})();
