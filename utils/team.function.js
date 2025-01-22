const { User } = require("../models/users.models");
const { Team } = require("../models/teams.models");

const addTeam = async (userId, teamData) => {
  const { name, description, members } = teamData;
  console.log("teamData in ", teamData);

  try {
    const user = await User.findById(userId);
    console.log("user in ", user);
    if (!user) {
      throw new Error("User not found");
    }

    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      throw new Error("Team name already exists");
    }

    // Validate member IDs
    const allMembers = [userId, ...(members || [])]; // Include creator in members
    const validMembers = await User.find({ _id: { $in: allMembers } });

    if (validMembers.length !== allMembers.length) {
      throw new Error("Some member IDs are invalid or do not exist");
    }

    const newTeam = {
      name,
      description,
      members: allMembers,
    };
    const team = new Team(newTeam);
    await team.save();
    user.teams.push(team._id);
    await user.save();
    return team;
  } catch (error) {
    throw error;
  }
};

const getAllTeam = async () => {
  try {
    const team = await Team.find().populate("members", "name");
    return team;
  } catch (error) {
    throw error;
  }
};

const updateTeam = async (teamId, userId, teamData) => {
  try {
    const team = await Team.findById(teamId).populate("members", "name email");
    if (!team) {
      throw new Error("Team not found");
    }
    if (team.members.some((member) => member._id.toString() === userId)) {
      const updatedTeam = await Team.findByIdAndUpdate(teamId, teamData, {
        new: true,
      }).populate("members", "name email");
      return updatedTeam;
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { addTeam, getAllTeam, updateTeam };
