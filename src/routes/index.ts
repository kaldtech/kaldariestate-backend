import { Request, Router, Response } from 'express'
import { userRouter } from './user'
import { adminRouter } from './admin'
import { uploadRouter } from './upload'
import { countryController, propertyTypeController } from '../controllers'
import { userStatus } from '../common'
const router = Router()
const accessControl = (req: Request, res: Response, next: any) => {
    req.headers.userType = userStatus[req.originalUrl.split('/')[1]]
    next()
}
router.get('/country', countryController.get_country_states_cities)
router.post('/property_type/add', propertyTypeController.add_property_type)
router.use('/user', accessControl, userRouter)
router.use('/upload', accessControl, uploadRouter)
router.use('/admin', accessControl, adminRouter)

export { router }