const { User } = require("../models/users.models");
const { Project } = require("../models/projects.models");
const { Task } = require("../models/tasks.models");

const addProject = async (userId, projectData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!projectData.name) {
      throw new Error("Project name is required");
    }

    const existingProject = await Project.findOne({ name: projectData.name });
    if (existingProject) {
      throw new Error("Project name must be unique");
    }

    const project = {
      name: projectData.name,
      description: projectData.description,
      createdBy: userId,
    };

    const newProject = new Project(project);
    await newProject.save();
    user.projects = user.projects || [];
    user.projects.push(newProject._id);
    await user.save();
    return newProject;
  } catch (error) {
    console.error("Error in addProject:", error.message);
    throw error;
  }
};

const getAllProjects = async () => {
  try {
    const project = await Project.find().populate("createdBy", "name _id");
    return project;
  } catch (error) {
    throw new Error("Failed to fetch all projects");
  }
};

const getProjectById = async (userId) => {
  try {
    const user = await User.findById(userId).populate({
      path: "projects",
      populate: { path: "createdBy", select: "name _id" },
    });
    if (!user) {
      throw new Error("User not found");
    }
    return user.projects || [];
  } catch (error) {
    throw new Error("Failed to fetch the projects");
  }
};

const updatedProject = async (userId, projectId, dataToUpdate) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    const updateProject = await Project.findByIdAndUpdate(
      projectId,
      dataToUpdate,
      { new: true }
    );

    if (!updateProject) {
      throw new Error("Failed to update the project");
    }

    return updateProject;
  } catch (error) {
    throw new Error("Failed to udpated the project", error);
  }
};

const deleteProject = async (userId, projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.createdBy.toString() !== userId) {
      throw new Error("User is not authorized to delete this project");
    }

    await Task.deleteMany({ project: projectId });

    await User.findByIdAndUpdate(userId, { $pull: { projects: projectId } });

    // Delete the project
    const deletedProject = await Project.findByIdAndDelete(projectId);
    if (!deletedProject) {
      throw new Error("Failed to delete the project");
    }

    return deletedProject;
  } catch (error) {
    throw new Error("Failed to delete the project: " + error.message);
  }
};

module.exports = {
  getProjectById,
  getAllProjects,
  addProject,
  updatedProject,
  deleteProject,
};
