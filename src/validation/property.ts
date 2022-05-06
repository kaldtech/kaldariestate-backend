"use strict"
import * as Joi from "joi"
import { apiResponse } from '../common'
import { isValidObjectId } from 'mongoose'
import { Request, Response } from 'express'

export const add_property = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        type: Joi.string().required().error(new Error('type is required!')),
        buildYear: Joi.string().required().error(new Error('buildYear is required!')),
        squareFeet: Joi.string().required().error(new Error('squareFeet is required!')),
        bedroom: Joi.string().required().error(new Error('bedroom is required!')),
        bathroom: Joi.string().required().error(new Error('bathroom is required!')),
        garage: Joi.string().required().error(new Error('garage is required!')),
        price: Joi.number().required().error(new Error('price is required!')),
        description: Joi.string().required().error(new Error('description is required!')),
        address: Joi.string().required().error(new Error('address is required!')),
        latitude: Joi.number().required().error(new Error('latitude is required!')),
        longitude: Joi.number().required().error(new Error('longitude is required!')),
        city: Joi.string().required().error(new Error('city is required!')),
        state: Joi.string().required().error(new Error('state is required!')),
        country: Joi.string().required().error(new Error('country is required!')),
        image: Joi.array().required().error(new Error('image is required!')),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => { res.status(400).json(new apiResponse(400, error.message, {}, {})) })
}
export const update_property = async (req: Request, res: Response, next) => {
    const schema = Joi.object({
        id: Joi.string().required().error(new Error('id is required!')),
        type: Joi.string().error(new Error('type is string')),
        buildYear: Joi.string().error(new Error('buildYear is string')),
        squareFeet: Joi.string().error(new Error('squareFeet is string')),
        bedroom: Joi.string().error(new Error('bedroom is string')),
        bathroom: Joi.string().error(new Error('bathroom is string')),
        garage: Joi.string().error(new Error('garage is string')),
        price: Joi.number().error(new Error('price is number')),
        description: Joi.string().error(new Error('description is string')),
        address: Joi.string().error(new Error('address is string')),
        latitude: Joi.number().error(new Error('latitude is number')),
        longitude: Joi.number().error(new Error('longitude is number')),
        city: Joi.string().error(new Error('city is string')),
        state: Joi.string().error(new Error('state is string')),
        country: Joi.string().error(new Error('country is string')),
        image: Joi.array().error(new Error('image is array')),
    })
    schema.validateAsync(req.body).then(result => {
        if (!isValidObjectId(result.id)) return res.status(400).json(new apiResponse(400, "Invalid id format", {}, {}));
        return next()
    }).catch(error => { res.status(400).json(new apiResponse(400, error.message, {}, {})) })
}
export const by_id = async (req: Request, res: Response, next) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json(new apiResponse(400, 'invalid id', {}, {}));
    next()
}