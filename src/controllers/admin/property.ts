"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { propertyModel } from '../../database'
import { apiResponse, userStatus, URL_decode, getArea } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'

const ObjectId = require('mongoose').Types.ObjectId

export const get_property = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let response = await propertyModel.aggregate([
            { $match: { createdBy: ObjectId(user._id), isActive: true, isBlock: false } },
            {
                $lookup: {
                    from: "users",
                    let: { createdBy: "$createdBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$createdBy"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                        { $project: { name: 1, email: 1, image: 1, phoneNumber: 1 } }
                    ],
                    as: "user"
                }
            },
            {
                $lookup: {
                    from: "favorites",
                    let: { propertyId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$propertyId", "$$propertyId"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                    ],
                    as: "favoriteBy"
                }
            },
            {
                $project: {
                    type: 1, buildYear: 1, squareFeet: 1, bedroom: 1, bathroom: 1, garage: 1, price: 1, status: 1, description: 1, image: 1,
                    address: 1, latitude: 1, longitude: 1, createdBy: 1, isActive: 1,
                    user: 1,
                    isFavorite: { $cond: { if: { $in: [ObjectId(user?._id), "$favoriteBy.createdBy"] }, then: true, else: false } },
                }
            }
        ])
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('property'), response, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}
export const update_property = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'),
        id = req.body?.id,
        body = req.body
    try {
        let response = await propertyModel.findOneAndUpdate({ _id: ObjectId(id), isActive: true, }, body)
        if (response) {
            return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('property'), {}, {}))
        }
        else return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('property'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, {}))
    }
}
export const delete_property = async (req: Request, res: Response) => {
    reqInfo(req)
    let { id } = req.params
    try {
        let response = await propertyModel.findOneAndUpdate({ _id: ObjectId(id), isActive: true }, { isActive: false })
        if (response) {
            return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess('property'), {}, {}))
        }
        else return res.status(404).json(new apiResponse(404, responseMessage?.getDataNotFound('property'), {}, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage.internalServerError, {}, {}))
    }
}

export const get_property_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    let { limit, page, search, userId } = req.body, skip = 0, response: any = {}, match: any = {}
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        if (search) {
            var typeArray: Array<any> = []
            search = search.split(" ")
            search.forEach(data => {
                typeArray.push({ type: { $regex: data, $options: 'si' } })
            })
            match.$or = [{ $and: typeArray }]
        }
        if (userId)
            match.createdBy = ObjectId(userId)
        match.isActive = true
        let property_data = await propertyModel.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "users",
                    let: { createdBy: "$createdBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$createdBy"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                        { $project: { name: 1, email: 1, image: 1, phoneNumber: 1 } }
                    ],
                    as: "user"
                }
            },
            {
                $facet: {
                    property: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                type: 1, buildYear: 1, squareFeet: 1, bedroom: 1, bathroom: 1, garage: 1, price: 1, status: 1, description: 1, image: 1,
                                address: 1, latitude: 1, longitude: 1, createdBy: 1, isActive: 1, createdAt: 1,
                                user: 1,
                            }
                        }
                    ],
                    property_count: [{ $count: "count" }]
                }
            },
        ])
        response.property_data = property_data[0].property || []
        response.state = {
            page, limit,
            page_limit: Math.ceil(property_data[0]?.property_count[0]?.count / limit)
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('property'), response, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const get_property_by_id = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')

    try {
        let response = await propertyModel.aggregate([
            { $match: { isActive: true, _id: ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: "users",
                    let: { createdBy: "$createdBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$createdBy"] },
                                        { $eq: ["$isActive", true] }
                                    ]
                                }
                            }
                        },
                        { $project: { name: 1, email: 1, image: 1, phoneNumber: 1 } }
                    ],
                    as: "user"
                }
            },
            {
                $project: {
                    type: 1, buildYear: 1, squareFeet: 1, bedroom: 1, bathroom: 1, garage: 1, price: 1, status: 1, description: 1, image: 1,
                    address: 1, latitude: 1, longitude: 1, createdBy: 1, isActive: 1,
                    user: 1,
                }
            }
        ])
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('property'), response, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}