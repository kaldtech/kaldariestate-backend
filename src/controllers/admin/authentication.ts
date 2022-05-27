
"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { propertyModel, userModel, userSessionModel } from '../../database'
import { apiResponse, loginType, URL_decode } from '../../common'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from 'config'
import { Request, Response } from 'express'
import { deleteImage } from '../../helpers/s3'
import async from 'async'
import { email_verification_mail, forgot_password_mail } from "../../helpers/mail";
import { responseMessage } from '../../helpers/response'
import { isDate } from 'moment'

const ObjectId = require('mongoose').Types.ObjectId
const jwt_token_secret = config.get('jwt_token_secret')
const refresh_jwt_token_secret = config.get('refresh_jwt_token_secret')

export const admin_signUp = async (req: Request, res: Response) => {
    reqInfo(req)

    try {
        let body = req.body, otpFlag = 1, authToken = 0
        let isAlready: any = await userModel.findOne({ email: body?.email, isActive: true })
        if (isAlready) return res.status(409).json(new apiResponse(409, responseMessage?.alreadyEmail, {}, {}))
        if (isAlready?.isEmailVerified == false) return res.status(502).json(new apiResponse(502, responseMessage.emailUnverified, {}, {}));
        while (otpFlag == 1) {
            for (let flag = 0; flag < 1;) {
                authToken = await Math.round(Math.random() * 10000)
                if (authToken.toString().length == 4) {
                    flag++
                }
            }
            let isAlreadyAssign = await userModel.findOne({ otp: authToken })
            if (isAlreadyAssign?.otp != authToken) otpFlag = 0
        }
        body.authToken = authToken
        body.otp = authToken
        // body.otpExpireTime = new Date(new Date().setMinutes(new Date().getMinutes() + 10))
        const salt = await bcryptjs.genSaltSync(8)
        const hashPassword = await bcryptjs.hash(body.password, salt)
        delete body.password
        body.password = hashPassword
        await new userModel(body).save()
        return res.status(200).json(new apiResponse(200, responseMessage?.signupSuccess, {}, {}))
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const login = async (req: Request, res: Response) => {
    let body = req.body,
        response: any
    reqInfo(req)
    try {

        response = await userModel.findOne({ email: body.email, isActive: true, userType: 1 }).select('-__v -createdAt -updatedAt')
        // console.log(await bcryptjs.hash(body.password, await bcryptjs.genSaltSync(10)))
        if (!response) return res.status(400).json(new apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}))
        const passwordMatch = await bcryptjs.compare(body.password, response.password)
        if (!passwordMatch) return res.status(400).json(new apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}))
        const token = jwt.sign({
            _id: response._id,
            authToken: response.authToken,
            type: response.userType,
            status: "Login",
            generatedOn: (new Date().getTime())
        }, jwt_token_secret)
        const refresh_token = jwt.sign({
            _id: response._id,
            generatedOn: (new Date().getTime())
        }, refresh_jwt_token_secret)
        await new userSessionModel({
            createdBy: response._id,
            refresh_token
        }).save()
        response = {
            userType: response?.userType,
            loginType: response?.loginType,
            _id: response?._id,
            name: response?.name,
            email: response?.email,
            image: response?.image,
            phoneNumber: response?.phoneNumber,
            isEmailVerified: response?.isEmailVerified,
            token,
            refresh_token
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.loginSuccess, response, {}))

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}
export const get_user_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let response: any, { isBlock, page, limit, search } = req.body, match: any = {}, userStatus: any
    try {
        if (search) {
            var nameArray: Array<any> = []
            var emailArray: Array<any> = []
            search = search.split(" ")
            search.forEach(data => {
                nameArray.push({ name: { $regex: data, $options: 'si' } })
                emailArray.push({ email: { $regex: data, $options: 'si' } })
            })
            match.$or = [{ $and: nameArray }, { $and: emailArray }]
        }
        match.isActive = true
        match = { ...(isBlock != undefined) && { isBlock }, ...match }
        match.userType = 0
        match.isEmailVerified = true
        response = await userModel.aggregate([
            { $match: match },
            {
                $facet: {
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: (((page as number - 1) * limit as number)) },
                        { $limit: limit as number },
                        {
                            $lookup: {
                                from: "properties",
                                let: { createdBy: "$_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    { $eq: ["$createdBy", "$$createdBy"] },
                                                    { $eq: ["$isActive", true] }
                                                ]
                                            }
                                        }
                                    },
                                    { $count: "count" }
                                ],
                                as: "property"
                            }
                        },
                        { $project: { name: 1, image: 1, email: 1, phoneNumber: 1, isActive: 1, isBlock: 1, loginType: 1, createdAt: 1, lastLogin: 1, property: { $cond: [{ $eq: ["$property", []] }, { $const: 0 }, { $first: "$property.count" }] } } },
                    ],
                    data_count: [{ $count: "count" }]
                }
            },
        ])
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('user'), {
            user_data: response[0].data,
            state: {
                page: req.body?.page,
                limit: req.body?.limit,
                page_limit: Math.ceil(response[0].data_count[0]?.count / (req.body?.limit) as number) || 1,
                data_count: response[0].data_count[0]?.count,
            }
        }, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}
export const by_id = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'),
        id = req.params.id
    try {
        // let response = await userModel.findOne({ _id: ObjectId(id), isActive: true, userType: 0 }).select('-password -authToken -otp -otpExpireTime -createdAt -updatedAt -__v ')
        let response: any = await userModel.aggregate([
            { $match: { _id: ObjectId(id), isActive: true, userType: 0 } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "properties",
                    let: { createdBy: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$createdBy", "$$createdBy"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "property"
                }
            },
            { $project: { name: 1, image: 1, email: 1, phoneNumber: 1, isActive: 1, isBlock: 1, loginType: 1, createdAt: 1, property: { $cond: [{ $eq: ["$property", []] }, { $const: 0 }, { $first: "$property.count" }] } } }
        ])
        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('user'), response, {}))
        else return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, {}))
    }
}
export const delete_user = async (req: Request, res: Response) => {
    reqInfo(req)
    let { id } = req.params
    try {
        let response = await userModel.findOneAndUpdate({ _id: ObjectId(id), isActive: true, userType: 0 }, { isActive: false })
        if (response) {
            let deleteProperty = await propertyModel.findOneAndUpdate({ createdBy: ObjectId(id), isActive: true }, { isActive: false })
            return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess('user'), {}, {}))
        }
        else return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, {}))
    }
}
export const update_user = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'),
        id = req.body?.id,
        body = req.body
    try {
        let response = await userModel.findOneAndUpdate({ _id: ObjectId(id), isActive: true, userType: 0 }, body)
        if (response) {
            return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('user profile'), {}, {}))
        }
        else return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('user'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, {}))
    }
}
