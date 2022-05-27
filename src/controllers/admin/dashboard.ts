"use strict"
import { reqInfo } from '../../helpers/winston_logger'
import { userModel, propertyModel } from '../../database'
import { apiResponse, not_first_one, } from '../../common'
import { Request, Response } from 'express'
import { responseMessage } from '../../helpers/response'
import mongoose from 'mongoose'
import async from 'async'

const ObjectId = mongoose.Types.ObjectId

export const home_dashboard = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        const last_week = async (week) => {
            const currentDate = new Date()
            const weekDate = new Date()
            week = week * 7
            weekDate.setDate(weekDate.getDate() - week)
            return await userModel.aggregate([
                {
                    $match: {
                        isActive: true,
                        createdAt: { $gte: weekDate, $lte: currentDate }
                    }
                },
                {
                    $group: {
                        _id: { "weekly": { $substrCP: ["$createdAt", 5, 5] } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.weekly": -1 }
                },
            ])
        }

        const today_users = async () => {
            const currentDate = new Date()
            // Set Previous 12 months
            currentDate.setHours(0, 0, 0, 0)
            return await userModel.countDocuments({ isActive: true, createdAt: { $gte: currentDate } })
        }

        const last_year = async () => {
            const currentYear = new Date()
            // Set Previous 12 months
            const previousYear = new Date()
            previousYear.setFullYear(previousYear.getFullYear() - 1)
            previousYear.setDate(1)
            previousYear.setHours(0, 0, 0, 0)
            const monthsArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

            return await userModel.aggregate([
                {
                    $match: {
                        // productId: req.params.productId,
                        isActive: true,
                        createdAt: { $gte: previousYear, $lte: currentYear }
                    }
                },
                {
                    $group: {
                        _id: { "year_month": { $substrCP: ["$createdAt", 0, 7] } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.year_month": -1 }
                },
                // {
                //     $project: {
                //         _id: 0,
                //         count: 1,
                //         month_year: {
                //             $concat: [
                //                 { $arrayElemAt: [monthsArray, { $subtract: [{ $toInt: { $substrCP: ["$_id.year_month", 5, 2] } }, 1] }] },
                //                 "-",
                //                 { $substrCP: ["$_id.year_month", 0, 4] }
                //             ]
                //         }
                //     }
                // },
                // {
                //     $group: {
                //         _id: null,
                //         data: { $push: { k: "$month_year", v: "$count" } }
                //     }
                // },
                // {
                //     $project: {
                //         data: { $arrayToObject: "$data" },
                //         _id: 0
                //     },
                // }
            ])

        }

        const week_users = async () => {
            const currentDate = new Date()
            const weekDate = new Date()
            let week = 7
            weekDate.setDate(weekDate.getDate() - week)
            return await userModel.aggregate([
                {
                    $match: {
                        isActive: true,
                        createdAt: { $gte: weekDate, $lte: currentDate }
                    }
                },
                {
                    $group: {
                        _id: "$isActive",
                        count: { $sum: 1 }
                    }
                },
            ])
        }
        const today_property = async () => {
            const currentDate = new Date()
            // Set Previous 12 months
            currentDate.setHours(0, 0, 0, 0)
            return await propertyModel.countDocuments({ isActive: true, createdAt: { $gte: currentDate } })
        }

        const last_year_property = async () => {
            const currentYear = new Date()
            // Set Previous 12 months
            const previousYear = new Date()
            previousYear.setFullYear(previousYear.getFullYear() - 1)
            previousYear.setDate(1)
            previousYear.setHours(0, 0, 0, 0)
            const monthsArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

            return await propertyModel.aggregate([
                {
                    $match: {
                        isActive: true,
                        createdAt: { $gte: previousYear, $lte: currentYear }
                    }
                },
                {
                    $group: {
                        _id: { "year_month": { $substrCP: ["$createdAt", 0, 7] } },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.year_month": -1 }
                },
            ])

        }

        const week_property = async () => {
            const currentDate = new Date()
            const weekDate = new Date()
            let week = 7
            weekDate.setDate(weekDate.getDate() - week)
            return await propertyModel.aggregate([
                {
                    $match: {
                        isActive: true,
                        createdAt: { $gte: weekDate, $lte: currentDate }
                    }
                },
                {
                    $group: {
                        _id: "$isActive",
                        count: { $sum: 1 }
                    }
                },
            ])
        }
        let date = new Date();
        let [year, week, today, monthly_user, year_property, week_property_count, today_property_count, monthly_property]: any = await async.parallel([
            (callback) => { last_year().then(data => { callback(null, data[0] || 0) }).catch(err => { console.log(err) }) },  // YEAR 
            (callback) => { week_users().then(data => { callback(null, data || 0) }).catch(err => { console.log(err) }) },  // WEEK
            (callback) => { today_users().then(data => { callback(null, data || 0) }).catch(err => { console.log(err) }) },   // TODAY
            (callback) => { userModel.countDocuments({ isActive: true, createdAt: { $gte: new Date(date.getFullYear(), date.getMonth(), 2), $lte: new Date(date.getFullYear(), date.getMonth() + 1, 1) } }).then(data => { callback(null, data || 0) }).catch(err => { console.log(err) }) },   // TODAY
            (callback) => { last_year_property().then(data => { callback(null, data[0] || 0) }).catch(err => { console.log(err) }) },  // YEAR 
            (callback) => { week_property().then(data => { callback(null, data || 0) }).catch(err => { console.log(err) }) },   // WEEK
            (callback) => { today_property().then(data => { callback(null, data || 0) }).catch(err => { console.log(err) }) },  // TODAY
            (callback) => { propertyModel.countDocuments({ isActive: true, createdAt: { $gte: new Date(date.getFullYear(), date.getMonth(), 2), $lte: new Date(date.getFullYear(), date.getMonth() + 1, 1) } }).then(data => { callback(null, data || 0) }).catch(err => { console.log(err) }) },   // TODAY
        ])
        let return_response: any = {}
        if (year || year == 0) return_response.year = year
        if (week || week == 0) return_response.week = week
        if (today || today == 0) return_response.today = today
        if (monthly_user || monthly_user == 0) return_response.monthly_user = monthly_user
        if (year_property || year_property == 0) return_response.year_property = year_property
        if (week_property_count || week_property_count == 0) return_response.week_property_count = week_property_count
        if (today_property_count || today_property_count == 0) return_response.today_property_count = today_property_count
        if (monthly_property || monthly_property == 0) return_response.monthly_property = monthly_property
        return res.status(200).json(new apiResponse(200, `get admin dashboard successfully`, return_response, {}))
    } catch (error) {
        console.log(error)
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}
