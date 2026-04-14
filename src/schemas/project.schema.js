import { z } from 'zod';

const mediaSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
  order: z.number().optional().default(0),
});

export const projectCreateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().optional(),
  location: z.string().optional(), // New
  category: z.string().optional(), // New
  description: z.string().optional(),
  content: z.array(z.any()).optional(),
  mainPic: z.object({
    url: z.string().url(),
    publicId: z.string(),
  }).optional(),
  gallery: z.array(mediaSchema).optional(),
  videos: z.array(mediaSchema).optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  order: z.number().optional(),
  status: z.enum(["published", "draft"]).optional(),
  });


export const projectUpdateSchema = projectCreateSchema.partial();

export const reorderSchema = z.object({
  gallery: z.array(z.object({
    publicId: z.string(),
    order: z.number(),
  })).optional(),
  videos: z.array(z.object({
    publicId: z.string(),
    order: z.number(),
  })).optional(),
});
