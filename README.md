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
  - Home Page: http://app.payoman.com/
  - Admin Login: http://app.payoman.com/admin/login
  - User Login: http://app.payoman.com/api/user/login

## API's

- **Admin Routes:**

  - GET     http://app.payoman.com/admin/signup     : Admin signup page
  - POST     http://app.payoman.com/admin/signup    : Admin signup form submission

  - GET     http://app.payoman.com/admin/login      : Admin login page
  - POST     http://app.payoman.com/admin/login     : Admin login form submission

  - GET      http://app.payoman.com/admin           : Admin dashboard (displays total users)

  - GET     http://app.payoman.com/admin/users      : View all users

  - PUT     http://app.payoman.com/users/:id/status     : Update user status
  - PU      http://app.payoman.com/users/:id/kyc-status     : Update user KYC status
  - GET     http://app.payoman.com/user/:id/id-view     : Admin can view specific user's uploaded id

  - POST    http://app.payoman.com/admin/logout         : Admin logout

  - GET     http://app.payoman.com/admin/loans
  - GET     http://app.payoman.com/admin/loans/approve      : Approve loan
  - GET     http://app.payoman.com/admin/loans/decline      : Decline loan
  - GET      http://app.payoman.com/admin/loans/approve/:id     : Approve Loans
  - GET      http://app.payoman.com/admin/loans/decline/:id     : Decline Loans

/admin/loans
- **User Routes**

  - GET     http://app.payoman.com/api/user/signup  : User signup page
  - POST    http://app.payoman.com/api/user/signup  : User signup form submission

  - GET     http://app.payoman.com/api/user/login   : User login page
  - POST    http://app.payoman.com/api/user/login   : User login form submission

  - GET     http://app.payoman.com/user/dashboard   : User dashboard (displays KYC status)
  - GET     http://app.payoman.com/user/id-verify   : User KYC form page
  - POST    http://app.payoman.com/user/id-verify   : User submits KYC form
  - GET     http://app.payoman.com/user/:id/id-view : User can view their own uploaded id
  
  - GET     http://app.payoman.com/api/apply-loan   : Submits a loan application
  - POST    http://app.payoman.com/api/apply-loan   : User submits loan application
  - GET     http://app.payoman.com/loan-status/:loanId  : Shows loan status after loan request

   -GET     http://app.payoman.com/logout

- **Payment Routes**

  - GET     http://app.payoman.com/user/pay-details     : shows payment details of user
  - GET     http://app.payoman.com/user/pay-method  : shows payment methods for payment
  - POST    http://app.payoman.com/user/pay-method  : post payment methods for payment in db

  - GET     http://app.payoman.com/admin/payment-requests   : shows payment request to admin

  -POST     http://app.payoman.com/admin/payments/approve/:id
  -POST     http://app.payoman.com/admin/payments/decline/:id


 ## Error Handling

  - The application includes basic error handling for common scenarios such as user not found, invalid credentials, and server errors.
  - A 404 error page will be displayed for any unknown routes.