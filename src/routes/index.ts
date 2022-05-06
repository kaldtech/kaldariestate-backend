import { Request, Router, Response } from 'express'
import { userRouter } from './user'
import { uploadRouter } from './upload'
const router = Router()
// const accessControl = (req: Request, res: Response, next: any) => {
//     req.headers.userType = userStatus[req.originalUrl.split('/')[1]]
//     next()
// }
router.use('/user', userRouter)
router.use('/upload', uploadRouter)

export { router }