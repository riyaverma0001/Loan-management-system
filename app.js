const express = require('express');
const mongoose = require('./src/config');
const bcryptjs = require('bcryptjs');

const User = require('./src/model/user');
const Admin = require('./src/model/admin');
const Loan = require('./src/model/loan');
const PaymentRequest = require('./src/model/payment'); // Import the model

const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = 7000;

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';  // Change to a strong secret key

// Session configuration
app.use(session({
    secret: 'yourSecretKey',  // Change to a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }  // Set `secure: true` in production with HTTPS
}));

// Use connect-flash
app.use(flash());

// Middleware to make flash messages accessible in views
app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    res.locals.infoMessage = req.flash('info');
    next();
});

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// app.use(express.static(path.join(__dirname, 'images')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'src/images')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // The folder where the uploaded files will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Unique file name
    }
});
const upload = multer({ storage: storage });

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header,
    if (!token) {
        return res.status(403).send('A token is required for authentication');
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Invalid Token');
        }
        req.user = decoded; // Save the decoded user data to request
        next();
    });
};

// Middleware to check if admin is logged in
const checkAdminAuth = (req, res, next) => {
    if (!req.session.admin) {
        req.flash('error', 'You must be logged in as an admin to access this page.');
        return res.redirect('/admin/login'); // Redirect to admin login page
    }
    next(); // Proceed to the next middleware or route handler
};

//Home Page
 app.get('/', (req, res) => {
    res.render('home')
})


// Admin Routes
// Admin dashboard (with session check)
app.get('/admin',checkAdminAuth, async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    try {
        const totalUsers = await User.countDocuments();
        res.render('adminDashboard', { totalUsers: totalUsers });
    } catch (error) {
        console.error("Error fetching total users:", error);
        // res.status(500).json({ message: "Error fetching total users" });
        req.flash('error', 'Error fetching total users');
        res.redirect('/admin/login');
    }
});

app.get('/admin/users', checkAdminAuth, async (req, res) => {
    try {
        // Fetch all users without pagination
        const users = await User.find().lean();

        // Render the user list without pagination
        res.render('userDetails', { 
            users, 
            currentPage: 1, 
            totalPages: 1 // No pagination, so only one page
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        req.flash('error', 'An error occurred while fetching users.');
        res.redirect('/admin');  // Or any other fallback route
    }
});

// Admin - Update user status (with session check)
app.put('/users/:id/status', async (req, res) => {
    if (!req.session.admin) {
        // return res.status(401).send('Unauthorized');
        req.flash('error', 'Unauthorized');
        res.redirect('/admin/login');
    }

    const { id } = req.params;
    const { status } = req.body;

    try {
        if (!['active', 'inactive', 'onhold'].includes(status)) {
            // return res.status(400).json({ error: 'Invalid status value' });
            req.flash('error', 'Invalid status value')
            res.redirect('/admin/users');
        }

        const updatedUser  = await User.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedUser ) {
            // return res.status(404).json({ error: 'User  not found' });
            req.flash('error', 'User not found')
            res.redirect('/admin/users');
        }

        res.status(200).json({ success: true, user: updatedUser  });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Signup (GET)
app.get('/admin/signup', (req, res) => {
    if(!req.session.admin){
        return res.render('adminSignup');
    }
    res.redirect('/admin');
});

// Admin Signup (POST)
app.post('/admin/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            req.flash('error', 'Admin already exists. Please use a different email.');
            return res.redirect('/admin/signup');
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const newAdmin = new Admin({
            name,
            email,
            password: hashedPassword,
        });

        await newAdmin.save();
        if(req.query.type === 'json') {
            res.status(200).json({
                success: true,
                message: "Admin created successfully !"
            })
        }
        else {
            req.flash('success', 'Admin registered successfully! Please log in.');
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.error("Error registering admin:", error);
        req.flash('error', 'An error occurred during registration. Please try again.');
        res.redirect('/admin/signup');
    }
});

// Admin Login (GET)
app.get('/admin/login', (req, res) => {
    if(!req.session.admin){
        return res.render('adminLogin');
    }
    res.redirect('/admin');
});

// Admin Login (POST)
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingAdmin = await Admin.findOne({ email });
        if (!existingAdmin) {
            if (req.query.type === 'json') {
                return res.status(400).json({ success: false, message: "Admin not found, please signup" });
            }
            req.flash('error', 'Admin not found, please signup');
            return res.redirect('/admin/signup');
        }

        const isPasswordValid = await bcryptjs.compare(password, existingAdmin.password);
        if (!isPasswordValid) {
            if (req.query.type === 'json') {
                return res.status(400).json({ success: false, message: "Invalid password" });
            }
            req.flash('error', 'Invalid password');
            return res.redirect('/admin/login');
        }

        req.session.admin = {
            id: existingAdmin._id,
            name: existingAdmin.name,
            email: existingAdmin.email
        };

        // Generate JWT token
        const token = jwt.sign({ id: existingAdmin._id, email: existingAdmin.email }, JWT_SECRET, { expiresIn: '1d' });

        if (req.query.type === 'json') {
            return res.status(200).json({
                success: true,
                message: "Admin login successful!",
                token
            });
        } else {
            return res.redirect('/admin/');
        }        
    } catch (error) {
        console.error("Error logging in Admin:", error);
        return res.status(500).json({ success: false, message: "Error logging in Admin" });
    }
});


// Admin Logout API (POST)
app.post('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.redirect('/admin/login');
    });
});

// User KYC - Render Form (GET)
app.get('/user/id-verify', async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'You need to log in first.');
        return res.redirect('/api/user/login');
    }

    const user = await User.findById(req.session.user.id);

    if (user) {
        if (user.kycStatus === 'approved') {
            req.flash('success', 'Your KYC has been approved! You can now access the dashboard.');
            return res.redirect('/user/dashboard');
        } else if (user.kycStatus === 'inreview') {
            req.flash('info', 'Your KYC is under review. Please wait for admin approval.');
            return res.redirect('/user/dashboard'); 
        } else if (user.kycStatus === 'inactive') {
            req.flash('error', 'Your KYC is inactive. Please submit your documents.');
        } else if (user.kycStatus === 'rejected') {
            req.flash('error', 'Your KYC has been rejected. Please contact support.');
        }
    }

    res.render('userIdVerify', {
        successMessage: req.flash('success')[0] || null,
        errorMessage: req.flash('error')[0] || null,
        infoMessage: req.flash('info')[0] || null,
        user: user
    });
});


app.post('/user/id-verify', upload.fields([{ name: 'documentFront' }, { name: 'documentBack' }]), async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'User not found. Please log in again.');
        return res.redirect('/api/user/login');
    }

    const { documentType } = req.body;
    const documentFront = req.files?.documentFront?.[0]?.path || null;
    const documentBack = req.files?.documentBack?.[0]?.path || null;

    // Validate input fields
    if (!documentType || !documentFront || !documentBack) {
        req.flash('error', 'Please fill in all fields and upload both document images.');
        return res.redirect('/user/id-verify');
    }

    try {
        // Fetch the current user
        const user = await User.findById(req.session.user.id);

        if (!user) {
            req.flash('error', 'User not found in the database.');
            return res.redirect('/api/user/login');
        }

        // Update only if required
        const updateFields = {
            documentType,
            documentFront,
            documentBack,
        };

        // Update `kycStatus` only if it's null, inactive, or rejected
        if (!user.kycStatus || user.kycStatus === 'inactive' || user.kycStatus === 'rejected') {
            updateFields.kycStatus = 'inreview';
        }

        await User.findByIdAndUpdate(req.session.user.id, updateFields);

        // Fetch the updated user
        const updatedUser = await User.findById(req.session.user.id);

        // Handle statuses
        if (updatedUser.kycStatus === 'approved') {
            req.flash('success', 'Your KYC has been approved! You can now access the dashboard.');
            return res.redirect('/user/dashboard');
        } else if (updatedUser.kycStatus === 'inreview') {
            req.flash('info', 'Your KYC is under review. Please wait for admin approval.');
            return res.redirect('/user/dashboard');
        } else if (updatedUser.kycStatus === 'inactive') {
            req.flash('info', 'Your KYC is inactive. Please submit your documents.');
        } else if (updatedUser.kycStatus === 'rejected') {
            req.flash('error', 'Your KYC has been rejected. Please contact support.');
        }

        // Stay on the same page
        console.log('Rendering userIdVerify page');
        // res.render('userIdVerify', {
        //     successMessage: req.flash('success'),
        //     errorMessage: req.flash('error'),
        //     infoMessage: req.flash('info'),
        // });
        if(req.query.type === 'json') {
            res.status(200).json({
                success: true,
                message: "document uploaded !"
            })
        }
        else {
            res.redirect('/user/id-verify')
        }
        
    } catch (error) {
        console.error('Error processing KYC submission:', error);
        req.flash('error', 'An error occurred while submitting your KYC. Please try again.');
        res.redirect('/user/id-verify');
    }
});

// Admin - Update user KYC status
app.put('/users/:id/kyc-status', async (req, res) => {
    const { id } = req.params;
    const { kycStatus } = req.body;

    // Validate KYC status
    const validStatuses = ['approved', 'rejected', 'inactive', 'inreview'];
    if (!validStatuses.includes(kycStatus)) {
        // return res.status(400).json({ error: 'Invalid KYC status' });
        req.flash('error', 'Invalid KYC status');
        return res.redirect('/admin/users');
    }

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { kycStatus },
            { new: true }
        );

        if (!user) {
            // return res.status(404).json({ error: 'User  not found' });
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error updating KYC status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/user/dashboard', async (req, res) => {
    const userId = req.session.user?.id;
    if (!userId) {
        req.flash('error', 'Please log in to access the dashboard.');
        return res.redirect('/api/user/login');
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/api/user/login');
        }

        // Convert createdAt Unix timestamp to Date object (only for the user)
        user.createdAt = new Date(parseInt(user.createdAt));

        // Fetch all loans for the user
        const loans = await Loan.find({ userId: user._id });

        // Check if KYC status has changed
        const previousKycStatus = req.session.kycStatus;

        if (previousKycStatus && previousKycStatus !== user.kycStatus) {
            if (user.kycStatus === 'approved') {
                req.flash('success', 'Your KYC has been approved! You now have full access.');
            } else if (user.kycStatus === 'rejected') {
                req.flash('error', 'Your KYC has been rejected. Please contact support.');
            } else {
                req.flash('info', 'Your KYC is under review. Please wait for admin approval.');
            }
        }

        // Update session with latest KYC status
        req.session.kycStatus = user.kycStatus;

        // Pass flash messages to the view
        res.render('userDashboard', {
            user,
            loans,
            successMessage: req.flash('success'),
            errorMessage: req.flash('error'),
            infoMessage: req.flash('info'),
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        req.flash('error', 'An error occurred while fetching user details.');
        return res.redirect('/api/user/login');
    }
});


// User Signup (GET)
app.get('/api/user/signup', (req, res) => {
    if(!req.session.user) {
        return res.render('userSignup')
    }
    res.redirect('/user/dashboard');
});

// User Login (GET)
app.get('/api/user/login', (req, res) => {
    if(!req.session.user) {
        return res.render('userLogin');
    }
    res.redirect('/user/dashboard');
    
});

// User Signup (POST)
app.post('/api/user/signup', async (req, res) => {
    const { name, email, phone, password, confirmPassword, createdAt, status } = req.body;

    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match. Please try again.');
        return res.redirect('/api/user/signup');  // Redirect back to the signup page
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'User already exists. Please use a different email.');
            return res.redirect('/api/user/signup');
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const newUser = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            createdAt: createdAt || Date.now(),
            status: status || 'inactive',
            kycStatus: 'inactive', // Set initial KYC status as 'inactive'
        });

        await newUser.save();

        req.session.userName = newUser.name; // Assign the correct name from the newly created user object

        req.flash('success', 'Registration successful! Please log in.');
        if(req.query.type === 'json') {
            res.status(200).json({
                success: true,
                message: "User registered successfully !"
            })
        } else {
            res.redirect('/api/user/login');
        }
        
    } catch (error) {
        console.error("Error registering user:", error);
        req.flash('error', 'An error occurred during registration. Please try again.');
        res.redirect('/api/user/signup');
    }
});

app.post('/api/user/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser  = await User.findOne({ email });
        if (!existingUser ) {
            if(req.query.type === 'json') {
                return res.status(404).json({ success: false, message: 'User not found. Please check your email.' });
            }
            req.flash('error', 'User  not found. Please check your email.');
            return res.redirect('/api/user/login');
        }

        const isPasswordValid = await bcryptjs.compare(password, existingUser .password);
        if (!isPasswordValid) {
            if(req.query.type === 'json') {
                return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
            }
            req.flash('error', 'Invalid password. Please try again.');
            return res.redirect('/api/user/login');
        }

        req.session.userName = existingUser.name;
        existingUser.status = 'active';
        await existingUser.save();

        req.session.user = {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone,
            kycStatus: existingUser.kycStatus,
            createdAt: existingUser.createdAt,
        };

        // Generate JWT token
        const token = jwt.sign({ id: existingUser ._id, email: existingUser .email }, JWT_SECRET, { expiresIn: '1h' });
        
        if(req.query.type === 'json') {
            return res.status(200).json({
                success: true,
                message: "Login",
                token,
                user: req.session.user
            });
        }
        
        req.flash('success', 'Login successful!');
        res.redirect('/user/id-verify');
        
    } catch (error) {
        console.error("Error logging in user:", error);
        if(req.query.type === 'json') {
            return res.status(500).json({ success: false, message: 'An error occurred during login. Please try again later.' });
        }
        req.flash('error', 'An error occurred during login. Please try again later.');
        return res.redirect('/api/user/login');
    }
});


// Logout (GET)
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.redirect('/api/user/login');  // Redirect to the homepage after logout
    });
});

//GET documents view
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// GET - Render ID verification view with images
app.get('/user/:id/id-view', async (req, res) => {
    try {
        const userId = req.params.id;

        // Fetch the user from the database
        const user = await User.findById(userId);

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/users');
        }

        // Fetch the image paths
        const frontImageUrl = user.documentFront ? `/${user.documentFront}` : null;
        const backImageUrl = user.documentBack ? `/${user.documentBack}` : null;

        
        res.render('id_view', { frontImageUrl, backImageUrl, userName: req.session.userName });
    } catch (error) {
        console.error('Error fetching user ID images:', error);
        req.flash('error', 'Failed to fetch ID images');
        res.redirect('/admin/users');
    }
});

//GET   student load routes
app.get('/api/apply-loan',async(req, res) => {
    if (!req.session.user) {
        return res.redirect('/api/user/login');  // Redirect to login if not logged in
    }

    const userId = req.session.user.id.toString();
    res.render('studentLoan', { title: 'Apply for Loan', userId });  
    // res.render('studentLoan')
})

app.post('/api/apply-loan', async (req, res) => {
    console.log('req.body: ', req.body);
    const { studentName, collegeName, grade, amount, emiPlan } = req.body;

    // const userId = req.session.user ? req.session.user.id.toString() : null;
    const userId = req.body.userId || (req.session?.user?.id?.toString() ?? null);

    console.log('Received userId:', userId);
    console.log('Received studentName:', studentName);

    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found in database for userId:', userId);
            req.flash('error', 'User not found');
            return res.redirect('/api/apply-loan');
        }

        const loanAmount = parseFloat(amount);
        if (isNaN(loanAmount) || loanAmount <= 0) {
            req.flash('error', 'Invalid loan amount');
            return res.redirect('/api/apply-loan');
        }

        // EMI Plan and Interest Rate Mapping
        const emiDetails = {
            '3month': { interest: 0.05, duration: 3 },
            '6month': { interest: 0.10, duration: 6 },
            '12month': { interest: 0.13, duration: 12 },
        };

        const planDetails = emiDetails[emiPlan];
        if (!planDetails) {
            req.flash('error', 'Invalid EMI plan selected');
            return res.redirect('/api/apply-loan');
        }

        const interestRate = planDetails.interest;
        const duration = planDetails.duration;

        const totalCost = Math.round(loanAmount + loanAmount * interestRate);
        const monthlyEMI = Math.round(totalCost / duration);

        // Generate Due Dates
        const createdAt = new Date();
        const dueDates = [];
        for (let i = 1; i <= duration; i++) {
            const dueDate = new Date(createdAt);
            dueDate.setMonth(createdAt.getMonth() + i);

            dueDates.push({
                dueDate: dueDate.toISOString().split('T')[0],
                amount: monthlyEMI,
                status: 'Pending',
            });
        }

        // Save Loan with Interest Rate
        const loan = new Loan({
            userId,
            studentName,
            collegeName,
            grade,
            amount: loanAmount,
            interestRate, // Storing interest rate in DB
            emiPlan,
            totalCost,
            monthlyEMI,
            dueDates,
        });

        await loan.save();

        console.log('Loan application saved successfully:', loan);
        if(req.query.type === 'json') {
            res.status(200).json({
                success: true,
                message: 'Loan application saved in loan schema !',
            })
        } else {
            req.flash('info', 'Request for Loan sent successfully!');
            res.redirect(`/loan-status/${loan._id}`);
        }
       
    } catch (error) {
        console.error('Error during loan application:', error);
        req.flash('error', 'An error occurred while processing your loan application.');
        res.redirect('/api/apply-loan');
    }
});


//all loans data
app.get('/admin/loans', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login')
    }
    try {
        const loans = await Loan.find().populate('userId', 'name email'); // Populate specific fields from User
        // res.status(200).send(loans);
        res.render('loanTable', { loans });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to fetch loans' });
    }
});

app.get('/admin/loans/approve/:id', async (req, res) => {
    try {
        const loanId = req.params.id;

        // Find the loan by ID and update its status to 'Approved'
        const loan = await Loan.findByIdAndUpdate(loanId, { status: 'Approved' }, { new: true });

        if (!loan) {
            return res.status(404).send('Loan not found');
        }
        req.flash('success', 'Loan Approved')
        res.redirect('/admin/loans'); // Redirect to the loan applications page
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

app.get('/admin/loans/decline/:id', async (req, res) => {
    try {
        const loanId = req.params.id;

        // Find the loan by ID and update its status to 'Declined'
        const loan = await Loan.findByIdAndUpdate(loanId, { status: 'Declined' }, { new: true });

        if (!loan) {
            return res.status(404).send('Loan not found');
        }
        req.flash('error', 'Loan Declined')
        res.redirect('/admin/loans'); // Redirect to the loan applications page
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

//approve loans
app.get('/admin/loans/approve', async (req, res) => {
    try {
        const approvedLoans = await Loan.find({ status: 'Approved' }); // Assuming 'status' is the field for loan approval
        res.render('approvedLoans', { approvedLoans }); // Renders the frontend
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

//declined loans
app.get('/admin/loans/decline', async (req, res) => {
    try {
        const declinedLoans = await Loan.find({ status: 'Declined' }); // Assuming 'status' is the field for loan status
        res.render('declinedLoans', { declinedLoans }); // Render the EJS file with the data
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

//GET loan approval/decline
app.get('/loan-status/:loanId', async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Please log in to view your loan status.');
        return res.redirect('/api/user/login');  // Redirect to login if not logged in
    }

    try {
        // Disable caching to force fetch the latest data
        res.set('Cache-Control', 'no-store, must-revalidate');

        const userId = req.session.user.id;
        const loanId = req.params.loanId; // Get loanId from the route parameter

        console.log('User ID:', userId);  // Debugging: Log userId
        console.log('Loan ID:', loanId);  // Debugging: Log loanId

        if (!loanId) {
            req.flash('error', 'Invalid loan request.');
            return res.redirect('/user/dashboard');
        }

        // Fetch the loan document using loanId
        const loan = await Loan.findById(loanId).lean();

        // If no loan exists, or if the loan does not belong to the user
        if (!loan || loan.userId.toString() !== userId) {
            req.flash('error', 'Loan not found or unauthorized access.');
            return res.redirect('/user/dashboard');
        }

        console.log('Loan data:', loan);  // Debugging: Log the fetched loan data
        // Render the loan status page with updated loan data
        res.render('loanStatus', { title: 'Loan Status', loan });

    } catch (error) {
        console.error('Error fetching loan status:', error);
        req.flash('error', 'An error occurred while fetching loan status.');
        res.redirect('/user/dashboard');
    }
});


app.get('/user/pay-details', async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Please log in to view your payment details.');
        return res.redirect('/api/user/login');
    }

    try {
        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/api/user/login');
        }

        // Get loanId from query parameters
        const { loanId } = req.query;
        if (!loanId) {
            req.flash('error', 'Loan ID is required.');
            return res.redirect('/user/dashboard');
        }

        // Fetch the specific loan using loanId and userId
        // const loan = await Loan.findOne({ _id: loanId, userId: user._id }).populate('dueDates.paymentRequestId');
        const loan = await Loan.findOne({ _id: loanId, userId: user._id })
        .populate('dueDates.paymentRequestId')
        .lean({ getters: true });

        if (!loan) {
            req.flash('error', 'Loan not found.');
            return res.redirect('/user/dashboard');
        }

        const emiPlan = parseInt(loan.emiPlan.replace(/\D/g, ''), 10);
        if (isNaN(emiPlan) || emiPlan <= 0) {
            req.flash('error', 'Invalid EMI plan.');
            return res.redirect('/user/dashboard');
        }

        const startDate = new Date(loan.createdAt);
        const emiDates = [];

        // Construct EMI details
        for (let i = 1; i <= emiPlan; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(startDate.getMonth() + i);

            const dueDateEntry = loan.dueDates.find(due => {
                const dueDateObj = new Date(due.dueDate);
                return (
                    dueDateObj.getFullYear() === dueDate.getFullYear() &&
                    dueDateObj.getMonth() === dueDate.getMonth()
                );
            });

            emiDates.push({
                dueDate: dueDate.toISOString().split('T')[0],
                amount: loan.monthlyEMI,
                status: dueDateEntry?.status || 'Pending',
                paymentDetails: dueDateEntry?.paymentRequestId || null,
            });
        }

        console.log('EMI Dates:', emiDates);

        // res.render('paymentDetails', {
        //     loan: loan,
        //     name: user.name.charAt(0).toUpperCase() + user.name.slice(1),
        //     totalCost: loan.totalCost,
        //     amountPaid: loan.amountPaid,
        //     remainingBalance: loan.remainingAmount,
        //     emiPlan,
        //     emiDates,
        //     monthlyEMI: loan.monthlyEMI,
        //     nextDue: emiDates.find(emi => emi.status === 'Pending')?.dueDate || 'All Paid',
        // });
        res.render('paymentDetails', {
            loan: loan,
            name: user.name.charAt(0).toUpperCase() + user.name.slice(1),
            totalCost: loan.totalCost.toFixed(2),
            amountPaid: loan.amountPaid ? loan.amountPaid.toFixed(2) : '0.00',
            remainingBalance: loan.remainingAmount ? loan.remainingAmount.toFixed(2) : '0.00',
            emiPlan,
            emiDates,
            monthlyEMI: loan.monthlyEMI.toFixed(2),
            nextDue: emiDates.find(emi => emi.status === 'Pending')?.dueDate || 'All Paid',
        });
        
    } catch (error) {
        console.error('Error fetching payment details:', error);
        req.flash('error', 'An error occurred while fetching payment details.');
        res.redirect('/user/dashboard');
    }
});


app.get('/user/pay-method', async (req, res) => {
    // Log route access
    console.log('Route /user/pay-method accessed');    

    // Check if the user is logged in
    if (!req.session.user) {
        req.flash('error', 'Please log in to view your payment method.');
        return res.redirect('/api/user/login'); // Redirect to login if not logged in
    }

    try {
        // Fetch user details from the database using the session user ID
        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/user/login'); // Redirect if user not found
        }

        // Fetch loan details using loanId from the query parameters
        const loanId = req.query.loanId;
        console.log('loan id in get pay-method:' , loanId);
        
        const loan = await Loan.findById(loanId); // Find loan by loanId
        if (!loan) {
            req.flash('error', 'Loan details not found.');
            return res.redirect('/user/dashboard'); // Redirect if loan details are not found
        }

        // Extract dueDate from the query parameters, with a fallback value
        const dueDate = req.query.dueDate || new Date().toISOString().split('T')[0]; // Use today's date as default

        const amountDue = loan.monthlyEMI; // Assuming monthlyEMI is the amount due for payment

        // Capitalize the user's name
        const capitalizedName = user.name.charAt(0).toUpperCase() + user.name.slice(1);

        // Render the payment method page with the required data
        res.render('paymentMethod', {
            loan: loan,
            name: capitalizedName,
            amountDue: amountDue,
            totalCost: loan.totalCost,         // Replace with the actual property from your Loan model
            emiPlan: loan.emiPlan,             // Replace with the actual property
            monthlyEMI: loan.monthlyEMI,       // Replace with the actual property
            amountPaid: loan.amountPaid,       // Replace with the actual property
            remainingBalance: loan.remainingBalance, // Replace with the actual property
            dueDate: dueDate,                  // Pass dueDate from the query parameters
            paymentStatus: 'Pending'           // Example static value
        });
    } catch (error) {
        console.error('Error fetching user or loan details:', error);
        req.flash('error', 'An error occurred while fetching user details.');
        res.redirect('/user/login'); // Redirect on error
    }
});


app.post('/user/pay-method', async (req, res) => {
    try {
        console.log("Received Request Body:", req.body); // Debugging line

        const { loanId, paymentMethod, amount, referenceNo, address, bankName } = req.body;
        const userId = req.session.user?.id;

        if (!loanId) {
            req.flash('error', 'Loan ID is required.');
            return res.redirect(`/user/pay-details?loanId=${loanId || ''}`);
        }

        // Fetch the loan using both loanId and userId
        const loan = await Loan.findOne({ _id: loanId, userId });

        if (!loan) {
            req.flash('error', 'Invalid loan record.');
            return res.redirect(`/user/pay-details?loanId=${loanId}`);
        }

        console.log('loan id:', loan._id);

        // Validate remaining amount check
        if (loan.remainingAmount <= 0) {
            req.flash('error', 'Loan is already paid off or overpaid. No further payments can be made.');
            return res.redirect(`/user/pay-details?loanId=${loanId}`);
        }

        // Parse the amount to a number
        const paymentAmount = parseFloat(amount);
        
        if (isNaN(paymentAmount) || paymentAmount <= 0 || paymentAmount > loan.remainingAmount) {
            req.flash('error', 'Invalid payment amount.');
            return res.redirect(`/user/pay-details?loanId=${loanId}`);
        }

        // Create a new PaymentRequest
        const paymentRequest = new PaymentRequest({
            loanId,
            userId,
            paymentMethod,
            amount: paymentAmount,
            referenceNo: paymentMethod === 'Bank Transfer' ? referenceNo : undefined,
            address: paymentMethod === 'Collect Cash' ? address : undefined,
            bankName: paymentMethod === 'Bank Transfer' ? bankName : null,
            paymentStatus: 'Pending', // Set as Pending by default
        });

        await paymentRequest.save();

        req.flash('success', 'Payment request submitted! Awaiting admin approval.');
        res.redirect(`/user/pay-details?loanId=${loanId}`); // Pass loanId to pay-details page
    } catch (error) {
        console.error('Error processing payment:', error);
        req.flash('error', 'An error occurred while processing your payment.');
        res.redirect(`/user/pay-details?loanId=${req.body.loanId || ''}`);
    }
});

app.get('/admin/payment-requests', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    try {
        // Fetch payment requests and populate user and loan details
        const paymentRequests = await PaymentRequest.find()
            .populate('userId', 'name') // Populate with the user's name
            .populate('loanId', 'totalCost totalPaid remainingBalance monthsPaid monthlyEMI') // Populate with loan details
            .lean(); // Convert to plain objects for rendering

        // Enrich data with additional fields and calculations
        const enrichedRequests = paymentRequests.map(request => ({
            ...request,
            studentName: request.userId?.name || 'N/A', // User's name
            emiPlan: request.loanId?.monthlyEMI
                ? `${request.loanId.monthlyEMI} / month`
                : 'N/A', // EMI Plan info
            totalCost: request.loanId?.totalCost || 0, // Total loan cost
            amountPaid: request.loanId?.totalPaid || 0, // Total amount paid so far
            remainingAmount: request.loanId?.remainingBalance || 0, // Remaining amount
            monthsPaid: request.loanId?.monthsPaid || 0, // Months paid so far
            paymentMethod: request.paymentMethod || 'N/A', // Payment Method
            paymentDetails: getPaymentDetails(request), // Payment details based on method
        }));

        // Render the admin payment request view with enriched data
        res.render('adminPaymentRequest', {
            paymentRequests: enrichedRequests,
            successMessage: req.flash('success'),
            errorMessage: req.flash('error'),
        });
    } catch (error) {
        console.error('Error fetching payment requests:', error);
        res.render('adminPaymentRequest', {
            paymentRequests: [],
            successMessage: '',
            errorMessage: 'Failed to load payment requests. Please try again later.',
        });
    }
});

function getPaymentDetails(request) {
    if (request.paymentMethod === 'Bank Transfer') {
        return {
            bankName: request.bankName || 'N/A',
            referenceNo: request.referenceNo || 'N/A'
        };
    } else if (request.paymentMethod === 'Collect Cash') {
        return {
            address: request.address || 'N/A'
        };
    }
    return {};
}


//admin will approve payment
app.post('/admin/payments/approve/:id', async (req, res) => {
    const paymentRequestId = req.params.id;
    // let { amount } = req.body;  // Amount paid

    try {
        const paymentRequest = await PaymentRequest.findById(paymentRequestId);
        const amount = paymentRequest.amount;
        // Convert amount to a number (parse float)
        // amount = parseFloat(amount);  // Ensure it's a number

        console.log('amount in approve admin code:', amount);
        
        if (isNaN(amount)) {
            req.flash('error', 'Invalid amount.');
            return res.redirect('/admin/payment-requests');
        }

        // Find the payment request
        
        if (!paymentRequest) {
            return res.status(404).send('Payment request not found');
        }

        // Ensure that the payment amount doesn't exceed the remaining balance of the PaymentRequest
        if (amount > paymentRequest.remainingAmount) {
            req.flash('error', 'Payment amount exceeds the remaining amount of the payment request.');
            return res.redirect('/admin/payment-requests');
        }

        // Update payment request status and amount
        paymentRequest.paymentStatus = 'Approved';
        paymentRequest.remainingAmount -= amount;  // Deduct the amount from the remainingAmount in PaymentRequest
        paymentRequest.amountPaid += amount;  // Add the amount to the amountPaid in PaymentRequest
        
        await paymentRequest.save();

        // Optionally update the loan balance if necessary
        const loan = await Loan.findById(paymentRequest.loanId);
        if (!loan) {
            req.flash('error', 'Loan details not found.');
            return res.redirect('/user/dashboard');
        }

        
        // Optional: Update the total loan status (if needed)
        // This step can be skipped if you want to only track the payment status in the PaymentRequest schema
        loan.amountPaid += amount;  // Add to the total amount paid across all payment requests
        loan.remainingAmount -= amount;  // Deduct the amount from the loan's remaining amount
        loan.monthsPaid += 1;

        
        await loan.save();

        req.flash('success', 'Payment successfully approved.');
        res.redirect('/admin/payment-requests');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while processing the payment.');
        res.redirect('/admin/payment-requests');
    }
});

//decline payment
app.post('/admin/payments/decline/:id', async (req, res) => {
    const paymentRequestId = req.params.id;

    try {
        // Find the payment request
        const paymentRequest = await PaymentRequest.findById(paymentRequestId);
        if (!paymentRequest) {
            return res.status(404).send('Payment request not found');
        }

        // Update payment request status
        paymentRequest.paymentStatus = 'Declined';
        await paymentRequest.save();

        res.redirect('/admin/payment-requests');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// 404 Error Page (for any unknown route)
app.use((req, res) => {
    res.status(404).render('404_Page');
});

app.listen(port, () => {
    console.log(`
Admin panel: http://localhost:${port}/admin/login
User panel: http://localhost:${port}/api/user/login
Home page: http://localhost:${port}/ `);
});