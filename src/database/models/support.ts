import mongoose from 'mongoose'

const supportSchema = new mongoose.Schema({
    isActive: { type: Boolean, default: true },
    email: { type: String, default: null },
    name: { type: String, default: null },
    message: { type: String, default: null },
}, { timestamps: true })

export const supportModel = mongoose.model('support', supportSchema)