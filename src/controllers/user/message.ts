"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { favoriteModel, messageModel, roomModel } from '../../database'
import { apiResponse, } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'

const ObjectId = require('mongoose').Types.ObjectId

export const get_message = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'), { roomId } = req.query
    try {

        let response = await messageModel.aggregate([
            { $match: { roomId: ObjectId(roomId), isActive: true } },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    user: 1, message: 1, senderId: 1, receiverId: 1, createdAt: 1
                }
            }
        ])
        return res.status(200).json(new apiResponse(200, responseMessage?.getDataSuccess('message by roomId'), response, {}))
    } catch (error) {
        console.log(error);

        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}
