import { z } from "zod";
import { primaryRoles } from "./challenges/profile";

export const publicVisualizationNodeSchema = z.object({
  id: z.string().regex(/^p_[a-f0-9]{16}$/),
  alias: z.string().trim().min(1).max(24),
  category: z.enum(primaryRoles),
  degree: z.number().int().nonnegative().max(600)
}).strict();

export const publicVisualizationEdgeSchema = z.object({
  id: z.string().regex(/^e_[a-f0-9]{16}$/),
  source: z.string().regex(/^p_[a-f0-9]{16}$/),
  target: z.string().regex(/^p_[a-f0-9]{16}$/)
}).strict();

export const publicVisualizationPhotoSchema = z.object({
  id: z.string().regex(/^ph_[a-f0-9]{16}$/),
  alias: z.string().trim().min(1).max(24),
  url: z.string().url(),
  width: z.number().int().positive().max(10_000).optional(),
  height: z.number().int().positive().max(10_000).optional()
}).strict();

export const publicVisualizationTrackSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(100),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100)
}).strict();

const leadingTrackSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(100)
}).strict();

export const publicVisualizationSchema = z.object({
  generatedAt: z.string().datetime(),
  eventId: z.string().min(1).max(100),
  nodes: z.array(publicVisualizationNodeSchema).max(250),
  edges: z.array(publicVisualizationEdgeSchema).max(600),
  photos: z.array(publicVisualizationPhotoSchema).max(24),
  tracks: z.array(publicVisualizationTrackSchema).max(6),
  insights: z.array(z.string().trim().min(1).max(180)).max(4),
  metrics: z.object({
    participants: z.number().int().nonnegative(),
    connections: z.number().int().nonnegative(),
    approvedPhotos: z.number().int().nonnegative(),
    leadingTrack: leadingTrackSchema.nullable()
  }).strict()
}).strict();

export type PublicVisualizationSnapshot = z.infer<typeof publicVisualizationSchema>;
export type PublicVisualizationNode = z.infer<typeof publicVisualizationNodeSchema>;
export type PublicVisualizationEdge = z.infer<typeof publicVisualizationEdgeSchema>;
export type PublicVisualizationPhoto = z.infer<typeof publicVisualizationPhotoSchema>;
export type PublicVisualizationTrack = z.infer<typeof publicVisualizationTrackSchema>;
