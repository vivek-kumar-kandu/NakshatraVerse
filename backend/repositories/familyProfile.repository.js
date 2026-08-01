import FamilyProfile from "../models/FamilyProfile.model.js";

export async function create(record) {
  return await FamilyProfile.create(record);
}

export async function findById(id) {
  return await FamilyProfile.findById(id);
}

export async function findByUser(userId) {
  return await FamilyProfile.find({ userId }).sort({
    updatedAt: -1,
  });
}

export async function update(id, patch) {
  return await FamilyProfile.findByIdAndUpdate(
    id,
    patch,
    { new: true }
  );
}

export async function remove(id) {
  return await FamilyProfile.findByIdAndDelete(id);
}

export default {
  create,
  findById,
  findByUser,
  update,
  remove,
};