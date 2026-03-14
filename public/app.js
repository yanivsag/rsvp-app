document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rsvpForm');
  const guestCountGroup = document.getElementById('guestCountGroup');
  const guestCountInput = document.getElementById('guestCount');
  const decreaseBtn = document.getElementById('decreaseBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const submitBtn = document.getElementById('submitBtn');
  const successMessage = document.getElementById('successMessage');
  const newRsvpBtn = document.getElementById('newRsvpBtn');
  const nameError = document.getElementById('nameError');
  const attendingError = document.getElementById('attendingError');

  // Attendance radio buttons
  const attendingRadios = document.querySelectorAll('input[name="attending"]');

  attendingRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'yes') {
        guestCountGroup.style.display = 'block';
      } else {
        guestCountGroup.style.display = 'none';
        guestCountInput.value = 1;
      }
      attendingError.textContent = '';
    });
  });

  // Guest counter
  decreaseBtn.addEventListener('click', () => {
    const current = parseInt(guestCountInput.value) || 1;
    if (current > 1) {
      guestCountInput.value = current - 1;
    }
  });

  increaseBtn.addEventListener('click', () => {
    const current = parseInt(guestCountInput.value) || 1;
    if (current < 50) {
      guestCountInput.value = current + 1;
    }
  });

  // Form validation
  function validateForm() {
    let isValid = true;

    const fullName = document.getElementById('fullName').value.trim();
    if (!fullName) {
      nameError.textContent = 'נא להזין שם מלא';
      isValid = false;
    } else {
      nameError.textContent = '';
    }

    const attendingSelected = document.querySelector('input[name="attending"]:checked');
    if (!attendingSelected) {
      attendingError.textContent = 'נא לבחור האם תגיעו';
      isValid = false;
    } else {
      attendingError.textContent = '';
    }

    return isValid;
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const attending = document.querySelector('input[name="attending"]:checked').value === 'yes';
    const data = {
      full_name: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim() || null,
      attending: attending,
      guest_count: attending ? parseInt(guestCountInput.value) || 1 : 0,
      notes: document.getElementById('notes').value.trim() || null
    };

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'inline';

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message
        form.style.display = 'none';
        successMessage.style.display = 'block';

        if (attending) {
          document.getElementById('successTitle').textContent = 'תודה רבה! 🎉';
          document.getElementById('successText').textContent =
            `נרשמתם בהצלחה! מחכים לראות אתכם (${data.guest_count} אורחים)`;
        } else {
          document.getElementById('successTitle').textContent = 'תודה על העדכון';
          document.getElementById('successText').textContent = 'מקווים לראותכם באירועים הבאים';
        }
      } else {
        alert(result.error || 'אירעה שגיאה, נסו שוב');
      }
    } catch {
      alert('אירעה שגיאה בשליחה, בדקו את החיבור לאינטרנט ונסו שוב');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').style.display = 'inline';
      submitBtn.querySelector('.btn-loading').style.display = 'none';
    }
  });

  // New RSVP button
  newRsvpBtn.addEventListener('click', () => {
    form.reset();
    guestCountGroup.style.display = 'none';
    guestCountInput.value = 1;
    form.style.display = 'block';
    successMessage.style.display = 'none';
    nameError.textContent = '';
    attendingError.textContent = '';
  });
});
