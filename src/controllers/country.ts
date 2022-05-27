"use strict"
import { reqInfo } from '../helpers/winston_logger'
import { cityModel, countryModel, stateModel } from '../database'
import { apiResponse, cacheKeyName, } from '../common'
import { Request, Response } from 'express'
import { getCache, setCache } from '../helpers/caching'
import { responseMessage } from '../helpers/response'

const ObjectId = require('mongoose').Types.ObjectId

export const get_country_states_cities = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        let { stateId, countryId } = req.query as any, response: any
        if (Object.keys(req.query)?.length == 0) {
            response = await getCache('country')
            if (response) return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('country'), response, {}))
            else {
                response = await countryModel.find({ status: true }, { country: 1 }).sort({ country: 1 })
                await setCache('country', response)
            }
            return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('country'), response, {}))
        }
        if (countryId && !stateId) {
            response = await getCache(cacheKeyName?.country(countryId))
            if (response) return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('country by id'), response, {}))
            else {
                response = await stateModel.find({ countryId: ObjectId(countryId) }, { state: 1 }).sort({ state: 1 })
                await setCache(cacheKeyName?.country(countryId), response)
            }
            return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('country by id'), response, {}))
        }
        if (stateId) {
            response = await getCache(cacheKeyName?.state(stateId))
            if (response) return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('state by id'), response, {}))
            else {
                response = await cityModel.find({ stateId: ObjectId(stateId) }, { city: 1 }).sort({ city: 1 })
                await setCache(cacheKeyName?.state(stateId), response)
            }
            return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('state by id'), response, {}))
        }
        return res.status(400).json(new apiResponse(400, responseMessage?.invalidBodyFields, {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, error, {}))
    }
}