"use strict"
import * as Joi from "joi"
import { apiResponse } from '../common'
import { isValidObjectId } from 'mongoose'
import { Request, Response } from 'express'
import { responseMessage } from "../helpers/response"

export const signUp = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        name: Joi.string().required().error(new Error('name is required!')),
        email: Joi.string().required().error(new Error('email is required!')),
        password: Joi.string().required().error(new Error('password is required!')),
        // address: Joi.string().required().error(new Error('address is required!')),
        // latitude: Joi.number().required().error(new Error('latitude is required!')),
        // longitude: Joi.number().required().error(new Error('longitude is required!')),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

export const login = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        email: Joi.string().required().error(new Error('email is required!')),
        password: Joi.string().required().error(new Error('password is required!')),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

export const forgot_password = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        email: Joi.string().lowercase().max(50).required().error(new Error('email is string! & max length is 50')),
        phoneNumber: Joi.string().lowercase().max(50).required().error(new Error('phoneNumber is string! & max length is 50')),
    })
    schema.validateAsync(req.body).then(result => {
        req.body = result
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

export const reset_password = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        id: Joi.string().required().error(new Error('id is required!')),
        password: Joi.string().max(20).required().error(new Error('password is required! & max length is 20')),
        otp: Joi.number().required().error(new Error('otp is required!')),
    })
    schema.validateAsync(req.body).then(result => {
        if (!isValidObjectId(result.id)) return res.status(400).json(new apiResponse(400, 'invalid id', {}, {}))
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

export const otp_verification = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        otp: Joi.number().min(1000).max(9999).required().error(new Error('otp is required! & only is 6 digits'))
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

export const resend_otp = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        email: Joi.string().required().error(new Error('email is string! ')),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

export const update_profile = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        name: Joi.string().error(new Error('name is string')),
        phoneNumber: Joi.string().error(new Error('phoneNumber is string')),
        image: Joi.string().allow("").error(new Error('image is string')),
        // address: Joi.string().error(new Error('address is string!')),
        // latitude: Joi.number().error(new Error('latitude is number!')),
        // longitude: Joi.number().error(new Error('longitude is number!')),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => {
        res.status(400).json(new apiResponse(400, error.message, {}, {}))
    })
}

export const by_id = async (req: Request, res: Response, next: any) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json(new apiResponse(400, responseMessage.invalidId('id'), {}, {}))
    return next()
}

export const block = async (req: Request, res: Response, next: any) => {
    if (!isValidObjectId(req.params.id)) return res.status(400).json(new apiResponse(400, 'invalid id', {}, {}))
    if (typeof (req.params.isBlock) !== 'boolean') return res.status(400).json(new apiResponse(400, 'after id value is boolean', {}, {}))
    return next()
}

export const change_password = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        old_password: Joi.string().required().error(new Error('old_password is required! ')),
        new_password: Joi.string().required().error(new Error('new_password is required! ')),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => { res.status(400).json(new apiResponse(400, error.message, {}, {})) })
}

export const generate_token = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        old_token: Joi.string().required().error(new Error('old_token is required! ')),
        refresh_token: Joi.string().required().error(new Error('refresh_token is required! ')),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => { res.status(400).json(new apiResponse(400, error.message, {}, {})) })
}

export const set_password = async (req: Request, res: Response, next: any) => {
    const schema = Joi.object({
        password: Joi.string().required().error(new Error('password is required!')),
        token: Joi.string().required().error(new Error('token is required!')),
    })
    schema.validateAsync(req.body).then(result => {
        return next()
    }).catch(error => { res.status(400).json(new apiResponse(400, error.message, {}, {})) })
}
