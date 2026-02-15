// Keyboard navigation for package cards
document.querySelectorAll('.package-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const cube = card.getAttribute('data-cube');
            navigateToPackage(cube);
        }
    });
});

// Navigate to package details page
function navigateToPackage(cube) {
    window.location.href = `packages-details.html?cube=${cube}`;
}