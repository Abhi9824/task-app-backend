const { sign } = require("jsonwebtoken");
const { User } = require("../models/users.models");
const bcrypt = require("bcryptjs");

const signup = async (userData) => {
  const { name, email, password } = userData;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      name: name,
      email: email,
      password: hashedPassword,
    };
    const newUser = new User(user);
    const savedUser = await newUser.save();
    return savedUser;
  } catch (error) {
    console.log("Error creating a new user", error);
    throw new Error("User creation failed");
  }
};

const login = async (user, password) => {
  try {
    if (!user || !user.password) {
      console.log("User or password is missing");
      return null;
    }
    if (!password) {
      console.log("password not provided");
      return null;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      return user;
    } else {
      console.log("Incorrect password");
    }
  } catch (error) {
    throw new Error("Error logging in", error);
  }
};

const getAllUsers = async () => {
  try {
    const user = await User.find().populate("projects");
    return user;
  } catch (error) {
    throw new Error("Falied to get all users");
  }
};
const getUserDetails = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate("tasks")
      .populate("projects")
      .populate("teams")
      .populate({
        path: "tasks",
        populate: { path: "owners", select: "name email" },
      });
    console.log(user);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { login, signup, getAllUsers, getUserDetails };
