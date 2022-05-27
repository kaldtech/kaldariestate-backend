import mongoose from 'mongoose'

const citySchema = new mongoose.Schema({
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'state', required: true },
    city: { type: String, required: true },
    status: { type: Boolean, default: true, }
}, {
    timestamps: true
})

export const cityModel = mongoose.model('city', citySchema)