import express from 'express'
import { authenticationController, userController, propertyTypeController } from '../controllers'
import { userJWT } from '../helpers/jwt'
import { favoriteValidation, propertyValidation, userValidation, supportValidation } from '../validation'
const router = express.Router()

router.post('/signup', userValidation.signUp, authenticationController.signUp)
router.post('/login', userValidation.login, authenticationController.login)
router.post('/otp_verification', userValidation.otp_verification, authenticationController.otp_verification)
router.post('/forgot_password', userValidation.forgot_password, authenticationController.forgot_password)
router.post('/reset_password', userValidation.reset_password, authenticationController.reset_password)
router.post('/resend_otp', userValidation?.resend_otp, authenticationController.resend_otp)
router.get('/deletedata', authenticationController.deletedata)

//  ------   Authentication ------  
router.use(userJWT)

router.get('/profile', authenticationController.get_profile)
router.put('/profile/update', userValidation.update_profile, authenticationController.update_profile)
router.put('/change_password', userValidation.change_password, authenticationController.change_password)

//  ------ Property Type Routes -------
router.get('/property_type', propertyTypeController.get_property_type)

//  ------ Property Routes -------
router.get('/property', userController.get_property)
router.post('/property/add', propertyValidation.add_property, userController.add_property)
router.post('/property/get_location_wise', userController.get_property_location_wise)
router.post('/property/get_property_pagination', userController.get_property_pagination)
router.get('/property/:id', propertyValidation.by_id, userController.get_property_by_id)
router.post('/property/get_filter_property', userController.get_filter_property)
router.get('/own_property', userController.get_own_property)

//  ------ Room Routes -------
router.get('/room', userController.get_room)
router.post('/room/add', userController.add_room)


// -------  Favorite Routes -------
router.get('/favorite', userController.get_favorite)
router.post('/favorite/add', favoriteValidation.add_favorite, userController.add_favorite)

// -------  Room Routes -------
router.get('/message', userController.get_message)

// -------  Support Routes -------
router.post('/get/support', supportValidation.add_support, userController.add_support)
router.get('/get/support', userController.get_support)


export const userRouter = router