const mongoose = require("mongoose")
const propertySchema = new mongoose.Schema({
    type: { type: String, default: null },
    buildYear: { type: String, default: null },
    squareFeet: { type: String, default: null },
    bedroom: { type: String, default: null },
    bathroom: { type: String, default: null },
    garage: { type: String, default: null },
    price: { type: Number, default: 0 },
    status: { type: Number, default: 0, enum: [0, 1] }, // 0 - rent || 1 - sale
    description: { type: String, default: null },
    image: { type: Array, default: [] },
    address: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

export const propertyModel = mongoose.model('property', propertySchema)