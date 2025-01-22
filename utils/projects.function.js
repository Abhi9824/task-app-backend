const { User } = require("../models/users.models");
const { Project } = require("../models/projects.models");
const { Task } = require("../models/tasks.models");

const addProject = async (userId, projectData) => {
  try {
    const user = await User.findById(userId);
    console.log("user", user);
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
    };
    console.log("project", project);

    const newProject = new Project(project);
    await newProject.save();
    user.projects = user.projects || [];
    user.projects.push(newProject._id);
    await user.save();
    return newProject;
  } catch (error) {
    console.error("Error in addProject:", error.message); // Log the actual error
    throw error;
  }
};

const getAllProjects = async () => {
  try {
    const project = await Project.find();
    return project;
  } catch (error) {
    throw new Error("Failed to fetch all projects");
  }
};

const getProjectById = async (userId) => {
  try {
    const user = await User.findById(userId).populate("projects");
    console.log("user", user);
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
    const task = await Task.findOne({ project: projectId });
    if (!task) {
      throw new Error("Task related to this project not found");
    }
    const isOwner = task.owners.some((owner) => owner.toString() === userId);
    if (!isOwner) {
      throw new Error("User is not authorized to update this project");
    }
    const updateProject = await Project.findByIdAndUpdate(
      projectId,
      { dataToUpdate },
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
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const task = await Task.findOne({ project: projectId });
    if (!task) {
      throw new Error("Task related to this project not found");
    }

    const isOwner = task.owners.some((owner) => owner.toString() === userId);
    if (!isOwner) {
      throw new Error("User is not authorized to delete this project");
    }

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
