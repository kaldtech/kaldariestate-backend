"use strict"
import { reqInfo } from '../helpers/winston_logger'
import { propertyTypeModel } from '../database'
import config from 'config'
import { Request, Response } from 'express'
import { responseMessage } from '../helpers/response'
import { apiResponse } from '../common'

export const add_property_type = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body;
    try {
        let response = await new propertyTypeModel(body).save()
        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('property type'), response, {}))
        else return res.status(400).json(new apiResponse(400, responseMessage?.addDataError, `${response}`, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const get_property_type = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let response = await propertyTypeModel.find({ isActive: true }, { property_type: 1 })
        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('property type'), response, {}))
        else return res.status(400).json(new apiResponse(400, responseMessage?.getDataNotFound('property type'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, error, {}))
    }
}