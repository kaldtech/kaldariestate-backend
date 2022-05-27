import mongoose from 'mongoose'

const stateSchema = new mongoose.Schema({
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'country', required: true },
    state: { type: String, required: true },
    state_code: { type: String },
    status: { type: Boolean, default: true, }
}, { timestamps: true })

export const stateModel = mongoose.model('state', stateSchema)