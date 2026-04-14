import express from 'express';
import * as projectController from '../controllers/project.controller.js';

const router = express.Router();

router.get('/', projectController.getAllProjects);
router.get('/featured', projectController.getFeaturedProjects);
router.get('/:slug', projectController.getProjectBySlug);

export default router;
