// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const loanSchema = new Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     studentName: { type: String, required: true },
//     collegeName: { type: String, required: true },
//     grade: { type: String, required: true },
//     amount: { type: Number, required: true }, // Changed to Number for calculations
//     emiPlan: { type: String, required: true },
//     interestRate: { type: Number, required: true }, // Added Interest Rate Field
//     totalCost: { 
//         type: Number, 
//         set: v => parseFloat(v.toFixed(2)), // Ensures it's stored as two decimals
//         get: v => parseFloat(v.toFixed(2))  // Ensures retrieval as two decimals
//     }, // Total Loan Amount with Interest
//     monthlyEMI: { 
//         type: Number, 
//         set: v => parseFloat(v.toFixed(2)), 
//         get: v => parseFloat(v.toFixed(2)) 
//     }, // Monthly EMI
//     amountPaid: { type: Number, default: 0 }, // Amount Paid So Far
//     remainingAmount: {
//         type: Number,
//         default: function () {
//             return this.totalCost - this.amountPaid;
//         },
//         required: true,
//     },
//     monthsPaid: {
//         type: Number,
//         default: 0,
//         required: true,
//     },
//     status: { type: String, default: 'Pending' }, // Loan status (Pending, Approved, Rejected)
//     paymentStatus: {
//         type: String,
//         enum: ['Pending', 'Completed'],
//         default: 'Pending',
//     },
//     createdAt: { 
//         type: String, // Store as a string in "yyyy-mm-dd" format
//         default: function () {
//             const now = new Date();
//             return now.toISOString().split('T')[0]; // Format as "yyyy-mm-dd"
//         }
//     },
//     dueDates: [
//         {
//             dueDate: { type: Date, required: true },
//             amount: { 
//                 type: Number, 
//                 set: v => parseFloat(v.toFixed(2)), 
//                 get: v => parseFloat(v.toFixed(2)) 
//             },
//             status: { type: String, default: 'Pending' }, // "Pending", "Paid"
//             paymentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest' }, // Reference PaymentRequest
//         }
//     ]
// });

// // Function to set the interest rate based on EMI Plan
// loanSchema.pre('save', function (next) {
//     const interestRates = { '3month': 5, '6month': 10, '12month': 13 }; // Interest rates in %
    
//     // Set interest rate based on emiPlan
//     this.interestRate = interestRates[this.emiPlan] || 0; // Default to 0 if EMI plan is invalid

//     // Calculate total cost with interest
//     this.totalCost = this.amount * (1 + this.interestRate / 100);

//     // Calculate monthly EMI
//     const months = parseInt(this.emiPlan); // Extract number from emiPlan (e.g., '3month' -> 3)
//     if (!isNaN(months)) {
//         this.monthlyEMI = this.totalCost / months;
//     }

//     next();
// });

// module.exports = mongoose.model('Loan', loanSchema);


const mongoose = require('mongoose');
const { Schema } = mongoose;

const loanSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    collegeName: { type: String, required: true },
    grade: { type: String, required: true },
    amount: { type: Number, required: true }, // Loan principal amount
    emiPlan: { type: String, required: true },
    interestRate: { type: Number, required: true }, // Store interest rate

    totalCost: { 
        type: Number, 
        set: v => Math.round(v), // Store rounded value in DB
        get: v => Math.round(v)  // Retrieve rounded value
    }, 

    monthlyEMI: { 
        type: Number, 
        set: v => Math.round(v), 
        get: v => Math.round(v) 
    }, 

    amountPaid: { type: Number, default: 0 },
    remainingAmount: {
        type: Number,
        default: function () {
            return this.totalCost - this.amountPaid;
        },
        required: true,
    },
    monthsPaid: { type: Number, default: 0, required: true },
    status: { type: String, default: 'Pending' }, 
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending',
    },

    createdAt: { 
        type: String, 
        default: function () {
            const now = new Date();
            return now.toISOString().split('T')[0]; // Store in "yyyy-mm-dd" format
        }
    },

    dueDates: [
        {
            dueDate: { type: Date, required: true },
            amount: { 
                type: Number, 
                set: v => Math.round(v), 
                get: v => Math.round(v) 
            },
            status: { type: String, default: 'Pending' }, 
            paymentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest' }, 
        }
    ]
});

// **Middleware to Calculate and Round Values Before Saving**
loanSchema.pre('save', function (next) {
    const interestRates = { '3month': 5, '6month': 10, '12month': 13 };

    // Set interest rate based on emiPlan
    this.interestRate = interestRates[this.emiPlan] || 0; 

    // Calculate total cost with interest and ROUND IT
    this.totalCost = Math.round(this.amount * (1 + this.interestRate / 100));

    // Extract months from emiPlan and calculate EMI
    const months = parseInt(this.emiPlan);
    if (!isNaN(months)) {
        this.monthlyEMI = Math.round(this.totalCost / months);
    }
    next();
});

module.exports = mongoose.model('Loan', loanSchema);