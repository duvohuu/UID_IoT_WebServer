import express from 'express';
import { getDevices} from '../controllers/deviceController.js';

const router = express.Router();

router.get('/', getDevices);;

export default router;
