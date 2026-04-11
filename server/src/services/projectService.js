import { Project } from '../models/Project.js';

export async function createProject(data) {
  return Project.create({
    name: data.name,
    status: data.status,
    hoursSpent: data.hoursSpent,
    description: data.description ?? '',
  });
}

export async function listProjects() {
  return Project.find().sort({ updatedAt: -1 }).lean();
}

export async function updateProject(id, data) {
  const allowed = ['name', 'status', 'hoursSpent', 'description'];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  return Project.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
}
