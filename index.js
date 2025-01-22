const mongoose = require("mongoose");
require("dotenv").config();
const { initializeDatabase } = require("./db/db.connection");
const express = require("express");
const app = express();
app.use(express.json());
const jwt = require("jsonwebtoken");
const { User } = require("./models/users.models");
const JWT_SECRET = process.env.JWT_SECRET;
initializeDatabase();

const cors = require("cors");
const corsOption = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOption));

const {
  login,
  signup,
  getAllUsers,
  getUserDetails,
} = require("./utils/users.function");
const {
  addTask,
  updateTask,
  getTaskById,
  getAllTasks,
  getQuerTasks,
  deletedTask,
  getTaskCompletedLastWeek,
  getAllPendingTask,
  getAllClosedTasks,
} = require("./utils/tasks.function");
const { addTeam, getAllTeam, updateTeam } = require("./utils/team.function");
const {
  getProjectById,
  getAllProjects,
  addProject,
  updatedProject,
  deleteProject,
} = require("./utils/projects.function");
const { verifyAuth } = require("./middleware/auth.middleware");
const {
  addTags,
  getTagsByProject,
  getAllTags,
} = require("./utils/tags.function");

//user
app.post("/users/signup", async (req, res) => {
  const userData = req.body;
  if (!userData.name || !userData.email || !userData.password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const isUserExist = await User.findOne({ email: userData.email });
  if (isUserExist) {
    return res.status(400).json({ message: "User already exists" });
  } else {
    try {
      const newUser = await signup(userData);
      if (newUser) {
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
          expiresIn: "24h",
        });

        res
          .status(201)
          .json({ message: "Signup successful", user: newUser, token });
      } else {
        res.status(400).json({ message: "SignUp failed" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  }
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User Not found" });
    }
    const loggedInUser = await login(user, password);
    if (!loggedInUser) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: loggedInUser._id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.status(200).json({
      message: "Login Successful",
      user: loggedInUser,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

app.get("/users", async (req, res) => {
  try {
    const user = await getAllUsers();
    res.status(200).json({ message: "All users fetched", user });
  } catch (error) {
    throw new Error("Internal Server Error", error);
  }
});

app.get("/users/userDetails/me", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  try {
    const userDetails = await getUserDetails(userId);
    if (userDetails) {
      res
        .status(200)
        .json({ message: "UserDetails fetched", user: userDetails });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//tasks
app.post("/users/task/addTasks", verifyAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const taskData = req.body;
    if (!taskData.name || !taskData.project || !taskData.team) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newTask = await addTask(userId, taskData);
    if (newTask) {
      res
        .status(201)
        .json({ message: "Task Created successfully", task: newTask });
    } else {
      res.status(400).json({ message: "Task creation failed" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/users/task/updateTask/:taskId", verifyAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.user;
    const taskData = req.body;
    console.log("taskId", taskId);
    console.log("userId", userId);
    console.log("taskData", taskData);

    const updatedtask = await updateTask(taskId, taskData, userId);

    return res
      .status(200)
      .json({ message: "Task updated successfully", task: updatedtask });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/users/task/taskById", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  try {
    const task = await getTaskById(userId);
    if (task) {
      res.status(200).json({ message: "Fetched All tasks", task: task });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/users/task/getAllTasks", async (req, res) => {
  try {
    const task = await getAllTasks();
    if (task) {
      res.status(200).json({ message: "Fetched all tasks successfully", task });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/users/tasks", verifyAuth, async (req, res) => {
  try {
    const query = req.query;
    const task = await getQuerTasks(query);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/users/deleteTask/:taskId", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const { taskId } = req.params;
  try {
    const task = await deletedTask(userId, taskId);
    if (task) {
      res.status(200).json({ message: "Task deleted successfully", task });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//reports

app.get("/users/report/last-week", async (req, res) => {
  try {
    const taskReport = await getTaskCompletedLastWeek();
    return res.status(200).json({
      message: "Fetched last week report successfully",
      report: taskReport,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});

app.get("/users/report/pending", async (req, res) => {
  try {
    const taskPending = await getAllPendingTask();
    if (taskPending) {
      return res
        .status(200)
        .json({ message: "Fetched all pending task", report: taskPending });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.get("/users/report/closed", async (req, res) => {
//   try {
//     const taskClosed = await getAllClosedTasks();
//     if (taskClosed) {
//       return res
//         .status(200)
//         .json({ message: "Fetched all closed tasks", report: taskClosed });
//     }
//   } catch (error) {
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.get("/users/report/closed", async (req, res) => {
  const { groupBy } = req.query;

  if (!groupBy) {
    return res
      .status(400)
      .json({ error: "Missing 'groupBy' query parameter." });
  }
  try {
    const taskClosed = await getAllClosedTasks(groupBy);
    if (taskClosed.success) {
      return res.status(200).json({
        message: `Fetched closed tasks grouped by  ${groupBy}`,
        report: taskClosed,
      });
    } else {
      return res.status(500).json({ error: "Failed to fetch closed tasks." });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//teams
app.post("/users/team/addTeam", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const teamData = req.body;
  try {
    const team = await addTeam(userId, teamData);
    if (team) {
      return res.status(200).json({ message: "Team added successfully", team });
    } else {
      res.status(400).json({ error: "Failed to add team" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/users/team", async (req, res) => {
  try {
    const getAllTask = await getAllTeam();
    if (getAllTask) {
      return res
        .status(200)
        .json({ message: "Task fetched successfully", team: getAllTask });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/users/team/updatedTeam/:teamId", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const { teamId } = req.params;
  const teamData = req.body;
  try {
    const updatedTeam = await updateTeam(teamId, userId, teamData);
    if (updatedTeam) {
      return res
        .status(200)
        .json({ message: "Team updated successfully", team: updatedTeam });
    } else {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this team" });
    }
  } catch (error) {
    res.status(200).json({ error: "Internal Server Error", error });
  }
});

//projects
app.post("/users/project/addProject", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const projectData = req.body;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const project = await addProject(userId, projectData);
    res.status(201).json({ message: "Added project successfully", project });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put(
  "/users/project/updateProject/:projectId",
  verifyAuth,
  async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.user;
    const datatoUpdate = req.body;
    try {
      const project = await updatedProject(userId, projectId, datatoUpdate);
      if (project) {
        return res.status(200).json({
          message: "Project updated successfully",
          project: project,
        });
      } else {
        return res
          .status(404)
          .json({ message: "Failed to updated the project" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.delete(
  "/users/project/deleteProject/:projectId",
  verifyAuth,
  async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.user;
    try {
      const project = await deleteProject(userId, projectId);
      if (project) {
        return res.status(200).json({
          message: "Project deleted successfully",
          project: project,
        });
      } else {
        return res
          .status(404)
          .json({ message: "Failed to deleted the project" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/users/project/getAllProjects", async (req, res) => {
  try {
    const project = await getAllProjects();
    if (project) {
      return res.status(200).json({ message: "fetched all projects", project });
    } else {
      return res.status(400).json({ message: "No projects found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", error });
  }
});

app.get("/users/project/getProject", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  try {
    const project = await getProjectById(userId);
    if (project.length > 0) {
      return res
        .status(200)
        .json({ message: "Fetched projects by Id", project });
    } else {
      return res
        .status(404)
        .json({ message: "No projects found for this user" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//tags
app.post("/users/addTags", verifyAuth, async (req, res) => {
  const { userId } = req.user;
  const tag = req.body;
  try {
    const tags = await addTags(userId, tag);
    if (tags) {
      return res.status(200).json({ message: "Tags added successfully", tags });
    } else {
      return res.status(500).json({ message: "Failed to add tags" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});

app.get("/users/getTags", async (req, res) => {
  try {
    const tags = await getAllTags();
    return res.status(200).json({ message: "Fetched all tags", tags });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/users/projectByTags/:projectId", async (req, res) => {
  const { projectId } = req.params;
  try {
    const tags = await getTagsByProject(projectId);
    return res
      .status(200)
      .json({ message: "Fetched successfully project by tags", tags });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = 3000;
app.get("/", async (req, res) => {
  res.send("Hello its workasna here");
});

app.listen(PORT, () => {
  console.log(`PORT is running on ${PORT} port.`);
});
