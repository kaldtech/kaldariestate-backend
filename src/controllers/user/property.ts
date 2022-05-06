"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { propertyModel } from '../../database'
import { apiResponse, userStatus, URL_decode, getArea } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'

const ObjectId = require('mongoose').Types.ObjectId

export const add_property = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'), body = req.body
    body.createdBy = user._id
    try {
        let response = await new propertyModel(body).save()
        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('property'), response, {}));
        else return res.status(400).json(new apiResponse(400, responseMessage?.addDataError, {}, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const get_property = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let response = await propertyModel.aggregate([
            { $match: { isActive: true, createdBy: { $ne: ObjectId(user?._id) } } },
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
                        { $project: { name: 1, email: 1 } }
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

export const get_own_property = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let response = await propertyModel.aggregate([
            { $match: { isActive: true, createdBy: ObjectId(user._id) } },
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
                        { $project: { name: 1, email: 1 } }
                    ],
                    as: "user"
                }
            }
        ])
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('property'), response, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const get_property_location_wise = async (req: Request, res: Response) => {
    reqInfo(req)
    let { latitude, longitude } = req.body
    let user: any = req.header('user')
    try {
        let location_data = await getArea({ lat: latitude, long: longitude }, 10)
        let isInRange = await propertyModel.aggregate([
            {
                $match: {
                    isActive: true,
                    createdBy: { $ne: ObjectId(user?._id) },
                    latitude: { $gte: location_data.min.lat, $lte: location_data.max.lat },
                    longitude: { $gte: location_data.min.long, $lte: location_data.max.long },
                }
            },
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
                        { $project: { name: 1, email: 1 } }
                    ],
                    as: "user"
                }
            }
        ])
        if (isInRange.length == 0) return res.status(200).json(new apiResponse(200, `Sorry! We don't find property in your area.`, {}, {}))
        else return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('property'), isInRange, {}))
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const get_property_pagination = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    let { limit, page } = req.body, skip = 0, response: any = {}
    limit = parseInt(limit)
    skip = ((parseInt(page) - 1) * parseInt(limit))
    try {
        let property_data = await propertyModel.aggregate([
            { $match: { isActive: true, createdBy: { $ne: ObjectId(user?._id) } } },
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
                        { $project: { name: 1, email: 1 } }
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
                $facet: {
                    property: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                type: 1, buildYear: 1, squareFeet: 1, bedroom: 1, bathroom: 1, garage: 1, price: 1, status: 1, description: 1, image: 1,
                                address: 1, latitude: 1, longitude: 1, createdBy: 1, isActive: 1,
                                user: 1,
                                isFavorite: { $cond: { if: { $in: [ObjectId(user?._id), "$favoriteBy.createdBy"] }, then: true, else: false } },
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
    console.log(user._id);

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
                        { $project: { name: 1, email: 1 } }
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