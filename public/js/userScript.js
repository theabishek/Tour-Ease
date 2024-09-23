// Get the logo element
const logo = document.getElementById('logo');

// Add click event listener to the logo
logo.addEventListener('click', function() {
    // Log a message to confirm the click event
    console.log('Logo clicked');

    // Redirect to user/home.ejs
    window.location.href = '/';
});
