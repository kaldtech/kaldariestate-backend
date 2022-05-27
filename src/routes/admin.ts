"use strict"
import { Router } from 'express'
import { adminController, } from '../controllers'
import { userJWT } from '../helpers/jwt'
import { adminValidation, propertyValidation } from '../validation'
const router = Router()



router.post('/signup', adminValidation.admin_signUp, adminController.admin_signUp)
router.post('/login', adminValidation.admin_login, adminController.login)

//  ------   Only Admin APIs ------

router.use(userJWT)
//------- dashboard Routes APIS-------

router.get('/dashboard', adminController.home_dashboard)

// -------   User Routes APIS -------
router.post('/get_user', adminController.get_user_pagination)
router.get('/by_id/:id', adminValidation.by_id, adminController.by_id)
router.delete('/delete/:id', adminValidation.by_id, adminController.delete_user)
router.put('/user_update', adminController.update_user)

// ------- Property Routes APIS -------
router.get('/get_property', adminController.get_property)
router.post('/property/get_property_pagination', adminController.get_property_pagination)
router.put('/property/update', propertyValidation.update_property, adminController.update_property)
router.get('/property/:id', propertyValidation.by_id, adminController.get_property_by_id)
router.delete('/property/delete/:id', adminController.delete_property)

// ------- Support Routes APIS -------
router.get('/support', adminController.get_support)
router.get('/support/:id', adminValidation.by_id, adminController.support_by_id)

export const adminRouter = router