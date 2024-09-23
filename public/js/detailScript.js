const images = document.querySelectorAll(".slideshow-image");
const dots = document.querySelectorAll(".slideshow-dot");
let currentImageIndex = 0;
let slideInterval; // Declare a variable to store the interval

function showImage() {
	clearInterval(slideInterval); // Clear existing intervals

	for (let i = 0; i < images.length; i++) {
		images[i].style.display = "none";
		dots[i].classList.remove("active");
	}
	images[currentImageIndex].style.display = "block";
	dots[currentImageIndex].classList.add("active");

	slideInterval = setInterval(() => {
		currentImageIndex = (currentImageIndex + 1) % images.length;
		showImage();
	}, 3000);
}

dots.forEach((dot, index) => {
	dot.addEventListener("click", () => {
		currentImageIndex = index;
		showImage();
	});
});

// Start the slideshow on page load
showImage();

const detailHeadings = document.querySelectorAll(".other-details h3");

detailHeadings.forEach((heading) => {
	heading.addEventListener("click", () => {
		// Hide any currently open detail section
		const openContent = document.querySelector(
			'.detail-content[style*="display: block"]'
		);
		if (openContent) {
			openContent.style.display = "none";
		}

		// Toggle the display of the clicked section
		const siblingContent = heading.nextElementSibling;
		siblingContent.style.display =
			siblingContent.style.display === "block" ? "none" : "block";
	});
});
