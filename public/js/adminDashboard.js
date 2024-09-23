document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('content-container');

    // Function to load content based on the URL
    function loadContent(url) {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                contentContainer.innerHTML = html;
            })
            .catch(error => console.error('Error loading content:', error));
    }

    // Add event listeners to the buttons
    document.getElementById('dashboard-btn').addEventListener('click', () => {
        loadContent('/adminDashboard/dashboard'); // Adjust the URL to your route
    });

    document.getElementById('query-btn').addEventListener('click', () => {
        loadContent('/adminDashboard/query'); // Adjust the URL to your route
    });

    // Add event listeners for other buttons as needed
});
