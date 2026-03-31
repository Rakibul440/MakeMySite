import express from "express";
import { protect } from "../middlewares/auth.js";
import { deleteProject, getPreviewProject, getPublishedProjects, getSingleProject, makeRevision, rollbackToVersion, saveProjectCode, } from "../controllers/project.controller.js";

const projectRouter = express.Router();

projectRouter.post("/revision/:projectId", protect, makeRevision)
projectRouter.put("/save/:projectId", protect, saveProjectCode)
projectRouter.get("/rollback/:projectId/:versionId", protect, rollbackToVersion)
projectRouter.delete("/:projectId", protect, deleteProject)
projectRouter.get("/preview/:projectId", protect, getPreviewProject)
projectRouter.get("/published", getPublishedProjects)
projectRouter.get("/published/:projectId", getSingleProject)


export default projectRouter