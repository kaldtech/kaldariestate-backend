import mongoose from 'mongoose'

const countrySchema = new mongoose.Schema({
    country: { type: String, required: true },
    code: { type: String },
    shortName: { type: String, required: true },
    status: { type: Boolean, default: true, required: true }
}, { timestamps: true })

export const countryModel = mongoose.model('country', countrySchema)