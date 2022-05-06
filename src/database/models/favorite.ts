const mongoose = require('mongoose')
const favoriteSchema = new mongoose.Schema({
    propertyId: { type: mongoose.Schema.Types.ObjectId },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true })

export const favoriteModel = mongoose.model('favorite', favoriteSchema)