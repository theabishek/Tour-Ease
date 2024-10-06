# Tourease

Tourease is a web application designed for users to explore and book various travel destinations and hotels. Users can view detailed information about destinations and hotels, manage their bookings, and enjoy a seamless user experience with a robust authentication system. The admin interface allows for easy management of destinations and hotels.

## Features

- **User Authentication**: Secure login and registration for users.
- **Home Page**: A welcoming home page showcasing featured destinations and hotels.
- **Destination Page**: Users can browse through various travel destinations.
- **Hotel Page**: A dedicated page for viewing hotels, with details and booking options.
- **Detailed Views**: Users can view detailed information on each destination and hotel.
- **Booking Management**: Users can book hotels and view their bookings.
- **Admin Panel**: Admins can add, edit, or remove destinations and hotels.

## Technologies Used

- **Frontend**: EJS, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: OAuth for secure user authentication

## Installation

To run this project locally, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/theabishek/Tour-Ease.git
   cd Tour-Ease
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Setup MongoDB**:
   Ensure you have MongoDB installed and running on your local machine. Create a database named `tourease_db`.

4. **Start the Application**:
   ```bash
   node app.js
   ```
   or if you have nodemon installed:
   ```bash
   nodemon app.js
   ```

5. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`.

6. **Hotels and Destination**:
   You have to add hotels and destination by yourself because no API is used. You can sign up as admin and from admin panel you can add destination & hotels.

## Screenshots

Below are some screenshots of the application:

- **Home Page**  
![Home Page](https://raw.githubusercontent.com/theabishek/Tour-Ease/main/screenshots/home-page.jpg)

- **Destination Page**  
![Destination Page](https://raw.githubusercontent.com/theabishek/Tour-Ease/main/screenshots/destination-page.jpg)

- **Hotel Page**  
![Hotel Page](https://raw.githubusercontent.com/theabishek/Tour-Ease/main/screenshots/hotel-page.jpg)

- **Hotel Detail Page**  
![Hotel Detail Page](https://raw.githubusercontent.com/theabishek/Tour-Ease/main/screenshots/hotel-detail-page.jpg)

- **Destination Detail Page**  
![Destination Detail Page](https://raw.githubusercontent.com/theabishek/Tour-Ease/main/screenshots/destination-detail-page.jpg)

- **Registration Page**  
![Registration Page](https://raw.githubusercontent.com/theabishek/Tour-Ease/main/screenshots/registration-page.jpg)

- **Login Page**  
![Login Page](https://raw.githubusercontent.com/theabishek/Tour-Ease/main/screenshots/login-page.jpg)

- **Admin Panel Page**  
![Admin Panel Page](https://raw.githubusercontent.com/theabishek/Tour-Ease/main/screenshots/admin-panel-page.jpg)

## Troubleshooting

If you encounter issues while running the application, consider the following:

- Ensure MongoDB is running.
- Check that all necessary packages are installed correctly.
- Review the console for any error messages for more insights.

## Acknowledgments

- [Express.js](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js.
- [EJS](https://ejs.co/) - Embedded JavaScript templating.
- [MongoDB](https://www.mongodb.com/) - A document database designed for ease of development and scaling.

Feel free to contribute by submitting issues or pull requests!
