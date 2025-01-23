const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        password: { type: String, required: true },
        createdAt: { 
            type: String, // Store as a string in "yyyy-mm-dd" format
            default: function () {
                const now = new Date();
                return now.toISOString().split('T')[0]; // Format as "yyyy-mm-dd"
            }
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'onhold'],
            default: 'active',    
        }, 
        kycStatus: { type: String, enum: ['approved', 'rejected', 'inactive', 'inreview'], default: 'inactive' },
        // You can also add additional fields like document images if needed
        documentType: { type: String }, // Add this field
        documentFront: { type: String },  // Store file path for front image
        documentBack: { type: String },   // Store file path for back image
        // hasSubmittedLoanForm: { type: Boolean, default: false },
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
