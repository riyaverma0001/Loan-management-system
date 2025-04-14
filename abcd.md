# User Management System

This is a loan management system built with Node.js, Express, MongoDB, and other technologies like JWT, bcryptjs, and multer for handling file uploads.

## Features

- User Registration and Login
- Admin Registration and Login
- KYC (Know Your Customer) Verification
- Loan Application Submission
- Admin Dashboard for User Management
- Loan Approval and Decline
- Flash Messaging for Notifications
- JWT Authentication

- **Admin Panel:**
  - Admin signup and login
  - View all users and manage their status (active/inactive/onhold)
  - Manage KYC (Know Your Customer) status of users (approved, rejected, inactive)
  - Dashboard displaying total users
  - Logout functionality

- **User Panel:**
  - User signup and login
  - Submit KYC (Know Your Customer) documents for verification
  - Apply for loans (student loans)
  - Track KYC status
  - View loan application details and EMI plans

## Technologies Used

- **Backend:**
  - Node.js
  - Express.js
  - express-session (Sessions)
  - MongoDB (Mongoose)
  - JWT (JSON Web Tokens)
  - bcryptjs (Password hashing)
  - connect-flash (Flash messages for session-based alerts)
  - multer (File uploads)
  - path (Working with file and directory paths)

- **Frontend:**
  - EJS (Embedded JavaScript templates for rendering dynamic views)

## Install the dependencies:

  - npm install

## Run the server:

  - npm start

## Usage

  - User Registration: Users can register by filling out the signup form.
  - Admin Registration: Admins can register and manage users and loans.
  - KYC Verification: Users can submit their KYC documents for verification.
  - Loan Application: Users can apply for loans and check their status.

## Flash messages

  - Flash messages are used to provide feedback to users. They will be displayed on the next page after a redirect. 

## Open the application in your browser:

  - Admin Login: http://localhost:7000/admin/login
  - User Login: http://localhost:7000/api/user/login

## Routes

- **Admin Routes:**

  - GET /admin/signup: Admin signup page
  - POST /admin/signup: Admin signup form submission
  - GET /admin/login: Admin login page
  - POST /admin/login: Admin login form submission
  - GET /admin: Admin dashboard (displays total users)
  - GET /admin/users: View all users
  - PUT /users/:id/status: Update user status
  - PUT /users/:id/kyc-status: Update user KYC status
  - GET /user/:id/id-view: Admin can view specific user's uploaded id
  - POST /admin/logout: Admin logout
  - GET /admin/loans/approve: Approve loan
  - GET /admin/loans/decline: Decline loan
  - GET  /admin/loans/approve/:id: Approve Loans
  - GET  /admin/loans/decline/:id: Decline Loans

/admin/loans
- **User Routes**

    /logout

  - GET /user/signup: User signup page
  - POST http://localhost:7000/user/signup: User signup form submission
  - GET /user/login: User login page
  - POST /user/login: User login form submission
  - GET http://localhost:7000/user/dashboard: User dashboard (displays KYC status)
  - GET /user/id-verify: User KYC form page
  - POST /user/id-verify: User submits KYC form
  - GET /user/:id/id-view: User can view their own uploaded id
  - GET /apply-loan: Submits a loan application
  - POST /apply-loan: User submits loan application
  - GET /loans: View all loans
  - GET /loan-status: Shows loan status after loan request

- **Payment Routes**

/admin/payment-requests
  - GET /user/pay-details : shows payment details of user
  - GET /user/pay-method : shows payment methods for payment
  - POST /submit-payment : submits payment into db
  - GET /admin/payments : shows payment request to admin
  /admin/payments/approve/:id
  /admin/payments/decline/:id


  - POST /admin/approve/:id : Admin can approve payment request of user
  - POST /admin/decline/:id : Admin can decline payment request of user

## Error Handling

  - The application includes basic error handling for common scenarios such as user not found, invalid credentials, and server errors.
  - A 404 error page will be displayed for any unknown routes.