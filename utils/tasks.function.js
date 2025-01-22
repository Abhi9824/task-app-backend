const { Task } = require("../models/tasks.models");
const { User } = require("../models/users.models");
const { Team } = require("../models/teams.models");
const { Project } = require("../models/projects.models");

const addTask = async (userId, taskData) => {
  const {
    name,
    project,
    team,
    owners,
    tags,
    timeToComplete,
    status,
    createdAt,
  } = taskData;
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User Not found!");
    } else {
      const task = {
        name,
        project,
        team,
        owners,
        tags,
        timeToComplete,
        status,
        createdAt,
      };

      const newTask = new Task(task);
      const savedTask = await newTask.save();

      // Use populate after saving
      const populatedTask = await Task.findById(savedTask._id)
        .populate("team", "name")
        .populate("project", "name")
        .populate("owners", "name email")
        .populate("tags", "name");

      user.tasks.push(savedTask._id);
      await user.save();

      return populatedTask;
    }
  } catch (error) {
    throw error;
  }
};

const updateTask = async (taskId, dataToupdate, userId) => {
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    if (!task.owners.includes(userId)) {
      throw new Error("Unauthorized: You can only update your own task");
    }
    const updateTask = await Task.findByIdAndUpdate(taskId, dataToupdate, {
      new: true,
    })
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name email")
      .populate("tags", "name");
    return updateTask;
  } catch (error) {
    throw error;
  }
};

// const getTaskById = async (userId) => {
//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new Error("User not found");
//     } else {
//       const task = await Task.find()
//         .populate("project", "name")
//         .populate("team", "name")
//         .populate("owners", "name email");
//       return task;
//     }
//   } catch (error) {
//     console.error(error.message);
//     throw error;
//   }
// };
const getTaskById = async (userId) => {
  try {
    const tasks = await Task.find({ owners: userId })
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name email");
    return tasks;
  } catch (error) {
    throw error;
  }
};

const deletedTask = async (userId, taskId) => {
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const isOwner = task.owners.some((owner) => owner.toString() === userId);
    if (!isOwner) {
      throw new Error("User is not authorized to delete this task");
    }
    const deleteTask = await Task.findByIdAndDelete(taskId);
    return deleteTask;
  } catch (error) {
    throw new Error("Failed to delete the task");
  }
};

const getAllTasks = async () => {
  try {
    const task = await Task.find()
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name email")
      .populate("tags", "name");
    return task;
  } catch (error) {
    throw new Error("Failed to get all task");
  }
};

const getQuerTasks = async (query) => {
  try {
    const { team, owner, tags, project, status, createdAt } = query;
    const filter = {};
    if (team) {
      filter.team = team;
    }
    if (owner) {
      const user = await User.findOne({ name: owner });
      if (!user) {
        throw new Error("Onwer not found");
      }
      filter.owners = user._id;
    }
    if (tags) {
      const tagArray = tags.split(",");
      filter.tags = { $all: tagArray };
    }
    if (project) {
      filter.project = project;
    }
    if (createdAt) {
      filter.createdAt = createdAt;
    }
    if (status) {
      const validStatus = ["To Do", "In Progress", "Completed", "Blocked"];
      if (!validStatus.includes(status)) {
        throw new Error("Invalid status value");
      }
      filter.status = status; // Must match one of the allowed enum values
    }
    const tasks = await Task.find(filter)
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name email");
    return tasks;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getTaskCompletedLastWeek = async () => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const tasks = await Task.find({
      status: "Completed",
      updatedAt: { $gte: oneWeekAgo },
    });
    return tasks;
  } catch (error) {
    throw new Error("Failed to retreive the last week task data");
  }
};

const getAllPendingTask = async () => {
  try {
    const pendingTasks = await Task.aggregate([
      {
        $match: {
          status: { $in: ["To Do", "In Progress", "Blocked"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPendingTime: { $sum: "$timeToComplete" },
        },
      },
    ]);
    return {
      success: true,
      data: pendingTasks.length > 0 ? pendingTasks[0].totalPendingTime : 0,
    };
  } catch (error) {
    throw new Error("Failed to calculate total pending work", error);
  }
};
//last try:
// const getAllClosedTasks = async (groupBy) => {
//   try {
//     const groupFields = {
//       team: "team",
//       owner: "owners",
//       project: "project",
//     };

//     const groupByField = groupFields[groupBy];

//     if (!groupByField) {
//       throw new Error(
//         "Invalid groupBy parameter. Use 'team', 'owner', or 'project'."
//       );
//     }

//     // Fetch all closed tasks
//     const closedTasks = await Task.find({
//       status: { $regex: /^closed$/i },
//     }).populate("owners", "name");

//     // Group the tasks dynamically using JavaScript
//     const groupedTasks = closedTasks.reduce((acc, task) => {
//       const key = task[groupByField];
//       // acc[key] = (acc[key] || 0) + 1;
//       // If grouping by owners, we use the owner IDs and count tasks per owner
//       if (groupBy === "owner") {
//         task.owners.forEach((owner) => {
//           const ownerId = owner._id.toString();
//           acc[ownerId] = (acc[ownerId] || 0) + 1;
//         });
//       } else {
//         acc[key] = (acc[key] || 0) + 1;
//       }
//       return acc;
//     }, {});

//     // Fetch additional details for group names based on the grouping
//     let namesMapping = {};
//     if (groupBy === "project") {
//       const projects = await Project.find({
//         _id: { $in: Object.keys(groupedTasks) },
//       });
//       namesMapping = projects.reduce((map, project) => {
//         map[project._id] = project.name;
//         return map;
//       }, {});
//     } else if (groupBy === "team") {
//       const teams = await Team.find({
//         _id: { $in: Object.keys(groupedTasks) },
//       });
//       namesMapping = teams.reduce((map, team) => {
//         map[team._id] = team.name;
//         return map;
//       }, {});
//     } else if (groupBy === "owner") {
//       // const owners = await Task.find({
//       //   _id: { $in: Object.keys(groupedTasks) },
//       // });
//       // namesMapping = owners.reduce((map, owner) => {
//       //   map[owner._id] = owner.name;
//       //   return map;
//       // }, {});

//     }

//     // Transform the result into the desired format
//     const result = Object.entries(groupedTasks).map(([key, count]) => ({
//       group: key,
//       groupName: namesMapping[key] || "Unknown",
//       groupByField: groupByField,
//       taskCount: count,
//     }));

//     return {
//       success: true,
//       data: result,
//     };
//   } catch (error) {
//     throw new Error(
//       `Failed to calculate closed tasks by ${groupBy}: ${error.message}`
//     );
//   }
// };
const getAllClosedTasks = async (groupBy) => {
  try {
    const groupFields = {
      team: "team",
      owner: "owners", // 'owners' is an array in the Task model
      project: "project",
    };

    const groupByField = groupFields[groupBy];

    if (!groupByField) {
      throw new Error(
        "Invalid groupBy parameter. Use 'team', 'owner', or 'project'."
      );
    }

    // Fetch all closed tasks
    const closedTasks = await Task.find({
      status: { $regex: /^closed$/i },
    }).populate("owners", "name"); // Populate owners' names

    // Group the tasks dynamically using JavaScript
    const groupedTasks = closedTasks.reduce((acc, task) => {
      const key = task[groupByField];

      // If grouping by owners, we use the owner IDs and count tasks per owner
      if (groupBy === "owner") {
        task.owners.forEach((owner) => {
          const ownerId = owner._id.toString();
          acc[ownerId] = (acc[ownerId] || 0) + 1;
        });
      } else {
        acc[key] = (acc[key] || 0) + 1;
      }

      return acc;
    }, {});

    // Fetch additional details for group names based on the grouping
    let namesMapping = {};
    if (groupBy === "project") {
      const projects = await Project.find({
        _id: { $in: Object.keys(groupedTasks) },
      });
      namesMapping = projects.reduce((map, project) => {
        map[project._id] = project.name;
        return map;
      }, {});
    } else if (groupBy === "team") {
      const teams = await Team.find({
        _id: { $in: Object.keys(groupedTasks) },
      });
      namesMapping = teams.reduce((map, team) => {
        map[team._id] = team.name;
        return map;
      }, {});
    } else if (groupBy === "owner") {
      // Use the populated owners from Task model
      namesMapping = closedTasks.reduce((map, task) => {
        task.owners.forEach((owner) => {
          map[owner._id.toString()] = owner.name;
        });
        return map;
      }, {});
    }

    // Transform the result into the desired format
    const result = Object.entries(groupedTasks).map(([key, count]) => ({
      group: key,
      groupName: namesMapping[key] || "Unknown",
      groupByField: groupByField,
      taskCount: count,
    }));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    throw new Error(
      `Failed to calculate closed tasks by ${groupBy}: ${error.message}`
    );
  }
};

module.exports = {
  getQuerTasks,
  getAllTasks,
  getTaskById,
  addTask,
  updateTask,
  deletedTask,
  getTaskCompletedLastWeek,
  getAllPendingTask,
  getAllClosedTasks,
};
