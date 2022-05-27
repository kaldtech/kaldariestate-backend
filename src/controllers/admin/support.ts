"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { supportModel } from '../../database'
import { apiResponse, userStatus, URL_decode, getArea } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'
import { email_verification_mail } from '../../helpers/mail'

const ObjectId = require('mongoose').Types.ObjectId

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

export const support_by_id = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'),
        id = req.params.id
    try {
        let response = await supportModel.findOne({ _id: ObjectId(id), isActive: true })
        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('support'), response, {}))
        else return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('support'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, {}))
    }
}


