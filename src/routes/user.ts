import express from 'express'
import { authenticationController, userController } from '../controllers'
import { userJWT } from '../helpers/jwt'
import { favoriteValidation, propertyValidation, userValidation } from '../validation'
const router = express.Router()

router.post('/signup', userValidation.signUp, authenticationController.signUp)
router.post('/login', userValidation.login, authenticationController.login)
router.post('/otp_verification', userValidation.otp_verification, authenticationController.otp_verification)
router.post('/forgot_password', userValidation.forgot_password, authenticationController.forgot_password)
router.post('/reset_password', userValidation.reset_password, authenticationController.reset_password)

//  ------   Authentication ------  
router.use(userJWT)

router.get('/profile', authenticationController.get_profile)
router.put('/profile/update', userValidation.update_profile, authenticationController.update_profile)
router.put('/change_password', userValidation.change_password, authenticationController.change_password)

//  ------ Property Routes -------
router.get('/property', userController.get_property)
router.post('/property/add', propertyValidation.add_property, userController.add_property)
router.post('/property/get_location_wise', userController.get_property_location_wise)
router.post('/property/get_property_pagination', userController.get_property_pagination)
router.get('/property/:id', propertyValidation.by_id, userController.get_property_by_id)
router.get('/own_property', userController.get_own_property)

// -------  Favorite Routes -------
router.get('/favorite', userController.get_favorite)
router.post('/favorite/add', favoriteValidation.add_favorite, userController.add_favorite)

export const userRouter = router