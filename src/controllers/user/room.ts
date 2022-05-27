"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { favoriteModel, roomModel } from '../../database'
import { apiResponse, } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'

const ObjectId = require('mongoose').Types.ObjectId

export const add_room = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'), body = req.body
    try {
        body.userIds = [ObjectId(body?.userIds[0]), ObjectId(user?._id)]
        let roomAlreadyExist = await roomModel.findOne({ isActive: true, userIds: { $size: 2, $all: body.userIds } })
        if (roomAlreadyExist)
            return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('room'), { response: roomAlreadyExist }, {}))
        body.userIds = [ObjectId(body?.userIds[0])]
        body.userIds.push(ObjectId(user?._id))
        body.isActive = true
        body.createdBy = ObjectId(user?._id)
        let response = await roomModel.findOneAndUpdate(body, body, { upsert: true, new: true })
        return res.status(200).json(new apiResponse(200, responseMessage?.addDataSuccess('room'), { response }, {}))
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const get_room = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'), body = req.body
    try {

        let response = await roomModel.aggregate([
            { $match: { userIds: { $in: [ObjectId(user?._id)] }, isActive: true } },
            { $sort: { updatedAt: - 1 } },
            {
                $lookup: {
                    from: "users",
                    let: { userIds: "$userIds" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $in: ["$_id", "$$userIds"] },
                                        { $ne: ["$_id", ObjectId(user?._id)] },
                                        { $eq: ["$isActive", true] },
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                name: 1, image: 1
                            }
                        }
                    ],
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user"
                }
            },
            {
                $project: {
                    user: 1
                }
            },

        ])
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('room'), response, {}))
    } catch (error) {
        console.log(error);

        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}
