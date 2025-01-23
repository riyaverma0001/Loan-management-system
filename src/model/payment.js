const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan',
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Collect Cash'],
        required: true,
    },
    bankName: {
        type: String,
        required: function () {
            return this.paymentMethod === 'Bank Transfer';
        },
    },
    amount: {
        type: Number,
        required: true,
    },
    referenceNo: {
        type: String,
        required: function () {
            return this.paymentMethod === 'Bank Transfer';
        },
    },
    address: {
        type: String,
        required: function () {
            return this.paymentMethod === 'Collect Cash';
        },
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Declined'],
        default: 'Pending',
    },
    // dueDate: { type: Date, required: true },
    createdAt: { 
        type: String, // Store as a string in "yyyy-mm-dd" format
        default: function () {
            const now = new Date();
            return now.toISOString().split('T')[0]; // Format as "yyyy-mm-dd"
        }
    }
});

//virtually update loan schema from this schema

paymentRequestSchema.post('save', async function (doc) {
    if (doc.paymentStatus === 'Approved') {
        const loan = await mongoose.model('Loan').findById(doc.loanId);

        // Find the next due date that is still "Pending"
        const nextDueDate = loan.dueDates.find(
            dueDate => dueDate.status === 'Pending' || dueDate.status === 'Declined'
        );
        

        if (nextDueDate) {
            // Mark the due date as "Paid"
            nextDueDate.status = 'Approved';
            nextDueDate.paymentRequestId = doc._id; // Reference the PaymentRequest

            await loan.save();
        }
    } else if (doc.paymentStatus === 'Declined') {
        const loan = await mongoose.model('Loan').findById(doc.loanId);

        // Find the next due date that is still "Pending"
        const nextDueDate = loan.dueDates.find(dueDate => dueDate.status === 'Pending');

        if (nextDueDate) {
            // Mark the due date as "Paid"
            nextDueDate.status = 'Declined';
            nextDueDate.paymentRequestId = doc._id; // Reference the PaymentRequest

            await loan.save();
        }
        const allPaymentsCompleted = loan.dueDates.every(dueDate => dueDate.status === 'Approved');
        if (allPaymentsCompleted) {
            loan.paymentStatus = 'Completed'; // Update loan status to completed
            await loan.save();
        }
    }
});

const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);

module.exports = PaymentRequest;