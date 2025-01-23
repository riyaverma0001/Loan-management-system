const mongoose = require('mongoose');
const { Schema } = mongoose;

// const loanSchema = new Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     studentName: { type: String, required: true },
//     collegeName: { type: String, required: true },
//     grade: { type: String, required: true },
//     amount: { type: String, required: true },
//     emiPlan: { type: String, required: true },
//     totalCost: { type: Number, required: true }, // Total Loan Amount
//     monthlyEMI: { type: Number, required: true }, // Monthly EMI
//     amountPaid: { type: Number, default: 0 }, // Amount Paid So Far
//     remainingAmount: {
//         type: Number,
//         default: function () {
//             return this.totalCost - this.amountPaid;
//         },
//         required: true
//     },
//     monthsPaid: {
//         type: Number,
//         default: 0,
//         required: true
//     },
//     status: { type: String, default: 'Pending' }, // Loan status (e.g., Pending, Approved, Rejected)
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
//             amount: { type: Number, required: true },
//             status: { type: String, default: 'Pending' }, // "Pending", "Paid"
//         }
//     ]
// });

// module.exports = mongoose.model('Loan', loanSchema);

const loanSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    collegeName: { type: String, required: true },
    grade: { type: String, required: true },
    amount: { type: String, required: true },
    emiPlan: { type: String, required: true },
    totalCost: { type: Number, required: true }, // Total Loan Amount
    monthlyEMI: { type: Number, required: true }, // Monthly EMI
    amountPaid: { type: Number, default: 0 }, // Amount Paid So Far
    remainingAmount: {
        type: Number,
        default: function () {
            return this.totalCost - this.amountPaid;
        },
        required: true,
    },
    monthsPaid: {
        type: Number,
        default: 0,
        required: true,
    },
    status: { type: String, default: 'Pending' }, // Loan status (e.g., Pending, Approved, Rejected)
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending',
    },
    createdAt: { 
        type: String, // Store as a string in "yyyy-mm-dd" format
        default: function () {
            const now = new Date();
            return now.toISOString().split('T')[0]; // Format as "yyyy-mm-dd"
        }
    },
    dueDates: [
        {
            dueDate: { type: Date, required: true },
            amount: { type: Number, required: true },
            status: { type: String, default: 'Pending' }, // "Pending", "Paid"
            paymentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest' }, // Reference PaymentRequest
        }
    ]
});

module.exports = mongoose.model('Loan', loanSchema);
