"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { supportModel } from '../../database'
import { apiResponse, userStatus, URL_decode, getArea } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'
import { email_verification_mail } from '../../helpers/mail'

const ObjectId = require('mongoose').Types.ObjectId

export const add_support = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let response = new supportModel(req.body).save()
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('Help & Support'), response, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}
export const get_support = async (req: Request, res: Response) => {
    reqInfo(req)
    let response: any
    try {
        response = await supportModel.aggregate([
            { $match: { isActive: true } }
        ])
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('Help & Support'), response, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}
