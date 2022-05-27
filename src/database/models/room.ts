import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    userIds: { type: [{ type: mongoose.Schema.Types.ObjectId, default: null }], default: null },
}, { timestamps: true })

export const roomModel = mongoose.model('room', roomSchema)