import Project from '../models/Project.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import cloudinary from '../config/cloudinary.js';
import {
  projectCreateSchema,
  projectUpdateSchema,
  reorderSchema,
} from '../schemas/project.schema.js';

// --- Public Controllers ---

export const getAllProjects = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const tag = req.query.tag;
  const status = req.query.status || 'published';
  const featured = req.query.featured === 'true';

  const query = { status };
  if (tag) query.tags = tag;
  if (featured) query.isFeatured = true;

  const total = await Project.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const projects = await Project.find(query)
    .sort({ order: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  projects.forEach((p) => {
    p.gallery.sort((a, b) => a.order - b.order);
    p.videos.sort((a, b) => a.order - b.order);
  });

  return apiResponse(res, 200, true, 'Projects fetched', projects, {
    pagination: { page, limit, total, totalPages },
  });
});

export const getFeaturedProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ isFeatured: true, status: 'published' })
    .sort({ createdAt: -1 })
    .limit(6);

  projects.forEach((p) => {
    p.gallery.sort((a, b) => a.order - b.order);
    p.videos.sort((a, b) => a.order - b.order);
  });

  return apiResponse(res, 200, true, 'Featured projects fetched', projects);
});

export const getProjectBySlug = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ slug: req.params.slug });
  if (!project) return apiResponse(res, 404, false, 'Project not found');

  project.gallery.sort((a, b) => a.order - b.order);
  project.videos.sort((a, b) => a.order - b.order);

  return apiResponse(res, 200, true, 'Project fetched', project);
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return apiResponse(res, 404, false, 'Project not found');

  project.gallery.sort((a, b) => a.order - b.order);
  project.videos.sort((a, b) => a.order - b.order);

  return apiResponse(res, 200, true, 'Project fetched by ID', project);
});

// --- Admin Controllers ---

export const adminGetAllProjects = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;

  const total = await Project.countDocuments();
  const totalPages = Math.ceil(total / limit);

  const projects = await Project.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return apiResponse(res, 200, true, 'Admin projects fetched', projects, {
    pagination: { page, limit, total, totalPages },
  });
});

export const createProject = asyncHandler(async (req, res) => {
  const validation = projectCreateSchema.safeParse(req.body);
  if (!validation.success) {
    return apiResponse(res, 400, false, 'Invalid project data', validation.error);
  }

  const project = await Project.create(validation.data);
  return apiResponse(res, 201, true, 'Project created', project);
});

export const updateProject = asyncHandler(async (req, res) => {
  const validation = projectUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return apiResponse(res, 400, false, 'Invalid project data', validation.error);
  }

  const project = await Project.findByIdAndUpdate(req.params.id, validation.data, {
    new: true,
  });
  if (!project) return apiResponse(res, 404, false, 'Project not found');

  return apiResponse(res, 200, true, 'Project updated', project);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return apiResponse(res, 404, false, 'Project not found');

  const deletePromises = [];

  if (project.mainPic?.publicId) {
    deletePromises.push(cloudinary.uploader.destroy(project.mainPic.publicId));
  }

  project.gallery.forEach((item) => {
    if (item.publicId) {
      deletePromises.push(cloudinary.uploader.destroy(item.publicId));
    }
  });

  project.videos.forEach((item) => {
    if (item.publicId) {
      deletePromises.push(
        cloudinary.uploader.destroy(item.publicId, { resource_type: 'video' })
      );
    }
  });

  await Promise.all(deletePromises);
  await Project.findByIdAndDelete(req.params.id);

  return apiResponse(res, 200, true, 'Project and assets deleted');
});

export const toggleFeatured = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return apiResponse(res, 404, false, 'Project not found');

  project.isFeatured = !project.isFeatured;
  await project.save();

  return apiResponse(res, 200, true, `Project featured: ${project.isFeatured}`, project);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['published', 'draft'].includes(status)) {
    return apiResponse(res, 400, false, 'Invalid status');
  }

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!project) return apiResponse(res, 404, false, 'Project not found');

  return apiResponse(res, 200, true, `Project status updated to ${status}`, project);
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const { id, publicId } = req.params;
  const project = await Project.findById(id);
  if (!project) return apiResponse(res, 404, false, 'Project not found');

  const galleryItemIndex = project.gallery.findIndex((item) => item.publicId === publicId);
  const videoItemIndex = project.videos.findIndex((item) => item.publicId === publicId);

  if (galleryItemIndex === -1 && videoItemIndex === -1) {
    return apiResponse(res, 404, false, 'Media not found in project');
  }

  let resource_type = 'image';
  if (videoItemIndex !== -1) {
    resource_type = 'video';
    project.videos.splice(videoItemIndex, 1);
  } else {
    project.gallery.splice(galleryItemIndex, 1);
  }

  await cloudinary.uploader.destroy(publicId, { resource_type });
  await project.save();

  return apiResponse(res, 200, true, 'Media deleted', project);
});

export const reorderMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const validation = reorderSchema.safeParse(req.body);
  if (!validation.success) {
    return apiResponse(res, 400, false, 'Invalid reorder data', validation.error);
  }

  const project = await Project.findById(id);
  if (!project) return apiResponse(res, 404, false, 'Project not found');

  const { gallery, videos } = validation.data;

  if (gallery) {
    gallery.forEach((update) => {
      const item = project.gallery.find((g) => g.publicId === update.publicId);
      if (item) item.order = update.order;
    });
  }

  if (videos) {
    videos.forEach((update) => {
      const item = project.videos.find((v) => v.publicId === update.publicId);
      if (item) item.order = update.order;
    });
  }

  await project.save();
  return apiResponse(res, 200, true, 'Media reordered', project);
});
