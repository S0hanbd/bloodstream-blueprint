// Main JavaScript for Bloodstream Django app
document.addEventListener('DOMContentLoaded', () => {
    // Dynamic toggle for last donation date input on registration form
    const hasDonatedCheckbox = document.getElementById('id_has_donated_before');
    const donationDateWrapper = document.getElementById('donation_date_wrapper');

    if (hasDonatedCheckbox && donationDateWrapper) {
        const updateVisibility = () => {
            if (hasDonatedCheckbox.checked) {
                donationDateWrapper.style.display = 'block';
            } else {
                donationDateWrapper.style.display = 'none';
            }
        };
        updateVisibility();
        hasDonatedCheckbox.addEventListener('change', updateVisibility);
    }
});
