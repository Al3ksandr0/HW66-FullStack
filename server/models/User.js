import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    hash: {
        type: String,
        required: false
    },
    age: {
        type: Number,
        required: true
    },
    phone: {
        type: String,
        required: true
    }
});

userSchema.index({ name: 1 });
userSchema.index({ age: -1 });
userSchema.index({ phone: 1 });

const User = mongoose.model('User', userSchema);

export default User;