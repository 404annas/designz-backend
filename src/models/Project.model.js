import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, required: true },
    title: { type: String },
    location: { type: String }, // New field for card subtitle
    category: { type: String }, // New field for primary filtering
    description: String,
    content: [mongoose.Schema.Types.Mixed],
    mainPic: {
      url: String,
      publicId: String,
    },
    gallery: [
      {
        url: String,
        publicId: String,
        order: { type: Number, default: 0 },
      },
    ],
    videos: [
      {
        url: String,
        publicId: String,
        order: { type: Number, default: 0 },
      },
    ],
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
