import {Router} from 'express'
import { buyPlan, cancelSubscription, getSubscription, resetQuestionLimit } from '../controllers/subscription.js'
import auth from '../middlewares/auth.js'

const router=Router()
router.post('/buySubscription',auth,buyPlan)
router.get('/getSubscription/',auth,getSubscription)
router.get('/cancelSubscription',auth,cancelSubscription)
router.get('/resetQuestionLimit',resetQuestionLimit)
export default router