import mongoose from 'mongoose'
const propertyTypeSchema = new mongoose.Schema({
    property_type: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true })

export const propertyTypeModel = mongoose.model('property_type', propertyTypeSchema)