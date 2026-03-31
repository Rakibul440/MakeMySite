import express from "express";
import {
    createUserProject,
    getAllProjects,
    getUserCredits,
    getUserProject,
    purchaseCredits,
    toggleProjectPublish
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.js";

const userRouter = express.Router()

userRouter.get('/credits', protect, getUserCredits)
userRouter.post('/project', protect, createUserProject)
userRouter.get('/project/:projectId', protect, getUserProject)
userRouter.get('/projects', protect, getAllProjects)
userRouter.post('/toggle-project/:projectId', protect, toggleProjectPublish)
userRouter.get('/purchease-credits', protect, purchaseCredits)

export default userRouter