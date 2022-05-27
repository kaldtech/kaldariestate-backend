"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { favoriteModel, propertyModel } from '../../database'
import { apiResponse, userStatus, URL_decode, getArea } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'

const ObjectId = require('mongoose').Types.ObjectId

export const add_favorite = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'), body = req.body
    try {
        let propertyExist = await propertyModel.findOne({ _id: ObjectId(body.propertyId), isActive: true })
        if (!propertyExist) return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('property'), {}, {}))
        let existFav = await favoriteModel.findOne({ createdBy: ObjectId(user._id), propertyId: ObjectId(body.propertyId), isActive: true })
        if (existFav != null) {
            await favoriteModel.deleteOne({ createdBy: ObjectId(user._id), propertyId: ObjectId(body.propertyId) })
            return res.status(200).json(new apiResponse(200, "Property unfavorite successfully!", {}, {}));
        } else {
            await new favoriteModel({ createdBy: ObjectId(user._id), propertyId: ObjectId(body.propertyId) }).save()
            return res.status(200).json(new apiResponse(200, "Property favorite successfully!", {}, {}));
        }
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}
export const get_favorite = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let response = await favoriteModel.aggregate([
            { $match: { createdBy: ObjectId(user._id), isActive: true } },
            {
                $lookup: {
                    from: "properties",
                    let: { propertyId: "$propertyId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$_id', "$$propertyId"] },
                                        { $eq: ["$isActive", true] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "property"
                }
            },
            {
                $project: {
                    propertyId: 1, createdBy: 1, isActive: 1,
                    property: 1,
                }
            },
            {
                $addFields: { "isFavorite": true }
            }
        ])
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('property'), response, {}))
    } catch (error) {
        console.log(error);

        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}
