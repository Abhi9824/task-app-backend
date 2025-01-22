const { Project } = require("../models/projects.models");
const { User } = require("../models/users.models");
const { Tag } = require("../models/tags.models");
const addTags = async (userId, tagsToAdd) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if the tag already exists
    const existingTag = await Tag.findOne({ name: tagsToAdd.name });
    if (existingTag) {
      return existingTag;
    }

    // Create a new tag if it doesn't exist
    const newTag = new Tag({ name: tagsToAdd.name });
    return await newTag.save();
  } catch (error) {
    throw new Error(`Failed to add the tag: ${error.message}`);
  }
};

const getAllTags = async () => {
  try {
    const tags = await Tag.find();
    return tags;
  } catch (error) {
    throw new Error("Failed to get all tags");
  }
};
const getTagsByProject = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (project) {
      const tags = await Tag.find();
      return tags;
    } else {
      throw new Error("Project not found");
    }
  } catch (error) {
    throw new Error("Failed to get Tags");
  }
};

module.exports = { addTags, getAllTags, getTagsByProject };
