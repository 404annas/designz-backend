import express from 'express';
import * as projectController from '../controllers/project.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/projects', projectController.adminGetAllProjects);
router.get('/projects/:id', projectController.getProjectById);
router.post('/projects', projectController.createProject);
router.patch('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

router.patch('/projects/:id/toggle-featured', projectController.toggleFeatured);
router.patch('/projects/:id/status', projectController.updateStatus);

router.delete('/projects/:id/media/:publicId', projectController.deleteMedia);
router.patch('/projects/:id/media/reorder', projectController.reorderMedia);

export default router;
