"use strict"
import { reqInfo } from '../helpers/winston_logger'
import { userModel, userSessionModel } from '../database'
import { apiResponse, loginType, URL_decode } from '../common'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from 'config'
import { Request, Response } from 'express'
import { deleteImage } from '../helpers/s3'
import async from 'async'
import { email_verification_mail, forgot_password_mail } from "../helpers/mail";
import { responseMessage } from '../helpers/response'
import { isDate } from 'moment'

const ObjectId = require('mongoose').Types.ObjectId
const jwt_token_secret = config.get('jwt_token_secret')
const refresh_jwt_token_secret = config.get('refresh_jwt_token_secret')

export const signUp = async (req: Request, res: Response) => {
    reqInfo(req)

    try {
        let body = req.body, otpFlag = 1, authToken = 0
        let isAlready: any = await userModel.findOne({ email: body?.email, isActive: true })
        if (isAlready) return res.status(409).json(new apiResponse(409, responseMessage?.alreadyEmail, {}, {}))
        while (otpFlag == 1) {
            for (let flag = 0; flag < 1;) {
                authToken = await Math.round(Math.random() * 1000000)
                if (authToken.toString().length == 6) {
                    flag++
                }
            }
            let isAlreadyAssign = await userModel.findOne({ otp: authToken })
            if (isAlreadyAssign?.otp != authToken) otpFlag = 0
        }
        body.authToken = authToken
        body.otp = authToken
        body.otpExpireTime = new Date(new Date().setMinutes(new Date().getMinutes() + 10))
        const salt = await bcryptjs.genSaltSync(10)
        const hashPassword = await bcryptjs.hash(body.password, salt)
        delete body.password
        body.password = hashPassword
        await new userModel(body).save().then(async (data) => {
            await email_verification_mail(data, authToken)
            return res.status(200).json(new apiResponse(200, responseMessage?.signupSuccess, {}, {}))
        })
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const login = async (req: Request, res: Response) => {
    let body = req.body,
        response: any
    reqInfo(req)
    try {
        // response = await userModel.findOneAndUpdate({ email: body.email, isActive: true }, { $addToSet: { deviceToken: body?.deviceToken } }).select('-__v -createdAt -updatedAt')
        response = await userModel.findOne({ email: body.email, isActive: true }).select('-__v -createdAt -updatedAt')
        if (!response) return res.status(400).json(new apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}))
        const passwordMatch = await bcryptjs.compare(body.password, response.password)
        if (!passwordMatch) return res.status(400).json(new apiResponse(400, responseMessage?.invalidUserPasswordEmail, {}, {}))
        const token = jwt.sign({
            _id: response._id,
            authToken: response.authToken,
            type: response.userType,
            status: "Login",
            generatedOn: (new Date().getTime())
        }, jwt_token_secret)
        const refresh_token = jwt.sign({
            _id: response._id,
            generatedOn: (new Date().getTime())
        }, refresh_jwt_token_secret)
        await new userSessionModel({
            createdBy: response._id,
            refresh_token
        }).save()
        response = {
            userType: response?.userType,
            loginType: response?.loginType,
            _id: response?._id,
            name: response?.name,
            email: response?.email,
            image: response?.image,
            token,
            refresh_token
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.loginSuccess, response, {}))

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const forgot_password = async (req: Request, res: Response) => {
    reqInfo(req);
    let body = req.body,
        otpFlag = 1, // OTP has already assign or not for cross-verification
        otp = 0
    try {
        body.isActive = true;
        let data = await userModel.findOne(body);

        if (!data) {
            return res.status(400).json(new apiResponse(400, responseMessage?.invalidEmail, {}, {}));
        }
        while (otpFlag == 1) {
            for (let flag = 0; flag < 1;) {
                otp = await Math.round(Math.random() * 1000000);
                if (otp.toString().length == 6) {
                    flag++;
                }
            }
            let isAlreadyAssign = await userModel.findOne({ otp: otp });
            if (isAlreadyAssign?.otp != otp) otpFlag = 0;
        }
        let response: any = await forgot_password_mail(data, otp).then(result => { return result }).catch(error => { return error })
        if (response) {
            await userModel.findOneAndUpdate(body, { otp, otpExpireTime: new Date(new Date().setMinutes(new Date().getMinutes() + 10)) })
            return res.status(200).json(new apiResponse(200, `${response}`, {}, {}));
        }
        else return res.status(501).json(new apiResponse(501, responseMessage?.errorMail, {}, `${response}`));
    } catch (error) {
        return res
            .status(500)
            .json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
};

export const otp_verification = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body
    try {
        body.isActive = true
        let data = await userModel.findOne(body);
        if (!data) return res.status(400).json(new apiResponse(400, responseMessage?.invalidOTP, {}, {}))
        if (new Date(data.otpExpireTime).getTime() < new Date().getTime()) return res.status(410).json(new apiResponse(410, responseMessage?.expireOTP, {}, {}))
        const token = jwt.sign({
            _id: data._id,
            authToken: data.authToken,
            type: data.userType,
            status: "Login",
            generatedOn: (new Date().getTime())
        }, jwt_token_secret)
        const refresh_token = jwt.sign({
            _id: data._id,
            generatedOn: (new Date().getTime())
        }, refresh_jwt_token_secret)
        await new userSessionModel({
            createdBy: data._id,
            refresh_token
        }).save()
        if (data) return res.status(200).json(new apiResponse(200, responseMessage?.OTPverified, {
            userType: data?.userType,
            loginType: data?.loginType,
            _id: data?._id,
            name: data?.name,
            email: data?.email,
            image: data?.image,
            otp: data?.otp,
            token,
            refresh_token
        }, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const reset_password = async (req: Request, res: Response) => {
    reqInfo(req)
    let body = req.body,
        authToken = 0,
        id = body.id,
        otp = body?.otp
    delete body.otp
    try {
        const salt = await bcryptjs.genSaltSync(10)
        const hashPassword = await bcryptjs.hash(body.password, salt)
        delete body.password
        delete body.id
        body.password = hashPassword

        for (let flag = 0; flag < 1;) {
            authToken = await Math.round(Math.random() * 1000000)
            if (authToken.toString().length == 6) {
                flag++
            }
        }
        body.authToken = authToken
        body.otp = 0
        body.otpExpireTime = null
        let response = await userModel.findOneAndUpdate({ _id: ObjectId(id), isActive: true, otp: otp }, body, { new: true })
        if (response) {
            return res.status(200).json(new apiResponse(200, responseMessage?.resetPasswordSuccess, { action: "please go to login page" }, {}))
        }
        else return res.status(501).json(new apiResponse(501, responseMessage?.resetPasswordError, response, {}))

    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const change_password = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'),
        { old_password, new_password } = req.body,
        authToken: any
    try {
        let user_data = await userModel.findOne({ _id: ObjectId(user._id), isActive: true }).select('password')
        const passwordMatch = await bcryptjs.compare(old_password, user_data.password)
        if (!passwordMatch) return res.status(400).json(new apiResponse(400, responseMessage?.oldPasswordError, {}, {}))

        const salt = await bcryptjs.genSaltSync(10)
        const hashPassword = await bcryptjs.hash(new_password, salt)
        let response = await userModel.findOneAndUpdate({ _id: ObjectId(user._id), isActive: true }, { password: hashPassword })
        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.passwordChangeSuccess, {}, {}))
        else return res.status(501).json(new apiResponse(501, responseMessage?.passwordChangeError, {}, {}))
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const generate_token = async (req: Request, res: Response) => {
    let { old_token, refresh_token } = req.body
    reqInfo(req)
    try {
        let isVerifyToken = jwt.verify(old_token, jwt_token_secret)
        let refreshTokenVerify = jwt.verify(refresh_token, refresh_jwt_token_secret)
        if (refreshTokenVerify._id != isVerifyToken._id) return res.status(403).json(new apiResponse(401, responseMessage?.invalidOldTokenReFreshToken, {}, {}))

        let response = await userSessionModel.findOneAndUpdate({ createdBy: ObjectId(isVerifyToken._id), refresh_token, isActive: true }, { isActive: false })
        if (response == null) return res.status(404).json(new apiResponse(404, responseMessage?.refreshTokenNotFound, {}, {}))
        const token = jwt.sign({
            _id: isVerifyToken._id,
            authToken: isVerifyToken.authToken,
            type: isVerifyToken.userType,
            status: "Generate Token",
            generatedOn: (new Date().getTime())
        }, jwt_token_secret)
        refresh_token = jwt.sign({
            _id: response._id,
            generatedOn: (new Date().getTime())
        }, refresh_jwt_token_secret)
        await new userSessionModel({
            createdBy: response._id,
            refresh_token
        }).save()
        response = {
            token,
            refresh_token
        }
        return res.status(200).json(new apiResponse(200, responseMessage?.refreshTokenSuccess, response, {}))

    } catch (error) {
        if (error.message == "invalid signature") return res.status(403).json(new apiResponse(401, responseMessage?.differentToken, {}, {}))
        if (error.message == "jwt malformed") return res.status(403).json(new apiResponse(401, responseMessage?.differentToken, {}, {}))
        if (error.message === "jwt must be provided") return res.status(403).json(new apiResponse(401, responseMessage?.tokenNotFound, {}, {}))
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error))
    }
}

export const update_profile = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user'),
        body: any = req.body
    try {
        let existData = await userModel.findOne({ _id: { $ne: ObjectId(user._id) }, email: body.email, isActive: true })
        if (existData) return res.status(409).json(new apiResponse(409, responseMessage?.alreadyEmail, {}, {}))
        let response = await userModel.findOneAndUpdate({ _id: ObjectId(user._id), isActive: true }, body)
        if (body?.image != response?.image && response.image != null && body?.image != null && body?.image != undefined) {
            let [folder_name, image_name] = await URL_decode(response?.image)
            await deleteImage(image_name, folder_name)
        }
        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.updateDataSuccess('Your profile'), {}, {}))
        else return res.status(501).json(new apiResponse(501, responseMessage?.updateDataError('Your profile'), {}, {}))
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const get_profile = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let response = await userModel.findOne({ _id: ObjectId(user._id), isActive: true })
        if (response) return res.status(200).json(new apiResponse(200, responseMessage.getDataSuccess('Your profile'), response, {}))
        else return res.status(501).json(new apiResponse(501, responseMessage.getDataNotFound('profile'), {}, {}))
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const delete_account = async (req: Request, res: Response) => {
    reqInfo(req)
    let user: any = req.header('user')
    try {
        let response = await userModel.findOneAndUpdate({ _id: ObjectId(user._id), isActive: true }, { isActive: false }).select('image _id email name username')
        if (response) return res.status(200).json(new apiResponse(200, responseMessage?.deleteDataSuccess('account'), {}, {}))
        else return res.status(501).json(new apiResponse(501, responseMessage?.getDataNotFound('account'), {}, {}))
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, {}))
    }
}

export const user_logout = async (req: Request, res: Response) => {
    reqInfo(req)
    try {
        await userModel.findOneAndUpdate({ _id: ObjectId((req.header('user') as any)?._id), isActive: true, }, { $pull: { deviceToken: req.body?.deviceToken } })
        return res.status(200).json(new apiResponse(200, responseMessage?.logout, {}, {}));
    } catch (error) {
        return res.status(500).json(new apiResponse(500, responseMessage?.internalServerError, {}, error));
    }
}
