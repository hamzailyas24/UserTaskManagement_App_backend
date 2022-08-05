import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MONGO_URL } from "./config.mjs";

mongoose.connect(MONGO_URL, { useNewUrlParser: true }, () => {
  console.log("Successfully Connected to MongoDB!");
});

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

// user login signup schema

const User = mongoose.model("User", {
  first_name: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  last_name: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  email: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// create schema for add, update, and delete tasks of users with the user id in the database (tasks are stored in the database as an array).

const Task = mongoose.model("Task", {
  title: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  description: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  priority: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  time: {
    type: Date,
    required: true,
  },
  remarks: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  status: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user_id: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
});

app.get("/", (req, res) => {
  res.send("Welcome to User Tasks Management System");
});

// create a signup user route and save the user to the database

app.post("/signup", async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    first_name,
    last_name,
    email,
    password: hashedPassword,
  });

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).send({
      message: "User already exists",
      status: false,
    });
  }

  try {
    await user.save();
    res.send({
      message: "User created successfully",
      status: true,
      user: {
        user_id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.send({
      message: "Error creating user",
      status: false,
      error: error,
    });
  }
});

// create a login user route and check if the user exists in the database

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({
        message: "User does not exist",
        status: false,
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({
        message: "Invalid password",
        status: false,
      });
    }
    res.send({
      message: "User logged in successfully",
      status: true,
      user: {
        user_id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.send({
      message: "Error logging in user, Internal server error",
      status: false,
      error: error,
    });
  }
});

//create a get all users route and get all the users from the database except the password

app.get("/getallusers", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.send({
      message: "Users fetched successfully",
      status: true,
      users: users,
    });
  } catch (error) {
    res.send({
      message: "Error fetching users, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a get user by id route and get the user from the database except the password

app.get("/getuser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id, { password: 0 });
    if (!user) {
      return res.send({
        message: "User not found",
        status: false,
      });
    }
    return res.send({
      message: "User found",
      status: true,
      user: user,
    });
  } catch (error) {
    res.send({
      message: "Error getting user, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a update and delete user route and update the user in the database

app.post("/updateuser/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    first_name,
    last_name,
    email,
    password: hashedPassword,
  });

  try {
    await User.findByIdAndUpdate(id, user);
    res.send({
      message: "User updated successfully",
      status: true,
    });
  } catch (error) {
    res.send({
      message: "Error updating user, Internal server error",
      status: false,
      error: error,
    });
  }
});

app.post("/deleteuser/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.send({
        message: "User not found",
        status: false,
      });
    }
    return res.send({
      message: "User deleted successfully",
      status: true,
      user: user,
    });
  } catch (error) {
    res.send({
      message: "Error deleting user, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a add task route and save the task to the database with the user id

app.post("/addtask", async (req, res) => {
  const { user_id, title, description, priority, time, status } =
    req.body;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.send({
      message: "invalid user id",
      status: false,
    });
  }
  const task = new Task({
    user_id,
    title,
    description,
    priority,
    time,
    status,
  });

  try {
    await task.save();
    res.send({
      message: "Task created successfully",
      status: true,
      task: {
        task_id: task._id,
        user_id: task.user_id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        time: task.time,
        remarks: task.remarks,
        status: task.status,
        createdAt: task.createdAt,
      },
    });
  } catch (error) {
    res.send({
      message: "Error creating task, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a update task route and update the task of the user in the database with the user id

app.post("/updatetask", async (req, res) => {
  const {
    user_id,
    task_id,
    title,
    description,
    priority,
    time,
    remarks,
    status,
  } = req.body;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.send({
      message: "invalid user id",
      status: false,
    });
  }
  if (!mongoose.Types.ObjectId.isValid(task_id)) {
    return res.send({
      message: "invalid task id",
      status: false,
    });
  }
  const task = new Task({
    user_id,
    title,
    description,
    priority,
    time,
    remarks,
    status,
  });

  try {
    await Task.findByIdAndUpdate(task_id, task);
    res.send({
      message: "Task updated successfully",
      status: true,
    });
  } catch (error) {
    res.send({
      message: "Error updating task, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a delete task route and delete the task of the user from the database with the user id

app.post("/deletetask", async (req, res) => {
  const { user_id, task_id } = req.body;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.send({
      message: "invalid user id",
      status: false,
    });
  }
  if (!mongoose.Types.ObjectId.isValid(task_id)) {
    return res.send({
      message: "invalid task id",
      status: false,
    });
  }
  try {
    await Task.findOneAndDelete({ user_id, _id: task_id });
    res.send({
      message: "Task deleted successfully",
      status: true,
    });
  } catch (error) {
    res.send({
      message: "Error deleting task, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a get all tasks route and get all the tasks from the database with the user id

app.post("/getalltasks", async (req, res) => {
  const { user_id } = req.body;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.send({
      message: "invalid user id",
      status: false,
    });
  }
  try {
    const tasks = await Task.find({ user_id });
    res.send({
      message: "Tasks fetched successfully",
      status: true,
      tasks: tasks,
    });
  } catch (error) {
    res.send({
      message: "Error fetching tasks, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a get task by id route and get the task from the database with the user id

app.post("/gettask", async (req, res) => {
  const { user_id, task_id } = req.body;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.send({
      message: "invalid user id",
      status: false,
    });
  }
  if (!mongoose.Types.ObjectId.isValid(task_id)) {
    return res.send({
      message: "invalid task id",
      status: false,
    });
  }
  try {
    const task = await Task.findOne({ user_id, _id: task_id });
    if (!task) {
      return res.send({
        message: "Task not found",
        status: false,
      });
    }
    return res.send({
      message: "Task fetched successfully",
      status: true,
      task: task,
    });
  } catch (error) {
    res.send({
      message: "Error fetching task, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a get all user tasks route and get all the tasks from the database with the user id

app.post("/getallusertasks", async (req, res) => {
  const { user_id } = req.body;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.send({
      message: "Invalid user id",
      status: false,
    });
  }
  try {
    const tasks = await Task.find({ user_id });
    if (!tasks) {
      return res.send({
        message: "Tasks not found",
        status: false,
      });
    }
    return res.send({
      message: "Tasks fetched successfully",
      status: true,
      tasks: tasks,
    });
  } catch (error) {
    res.send({
      message: "Error fetching tasks, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a give remarks route and give the remarks of the user task to the user in the database with the user id.

app.post("/giveremarks", async (req, res) => {
  const { user_id, task_id, remarks } = req.body;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.send({
      message: "Invalid user id",
      status: false,
    });
  }
  if (!mongoose.Types.ObjectId.isValid(task_id)) {
    return res.send({
      message: "Invalid task id",
      status: false,
    });
  }
  try {
    const task = await Task.findById(task_id);
    if (!task) {
      return res.send({
        message: "Task not found",
        status: false,
      });
    }
    task.remarks = remarks;
    await task.save();
    res.send({
      message: "Remarks given successfully",
      status: true,
    });
  } catch (error) {
    res.send({
      message: "Error giving remarks, Internal server error",
      status: false,
      error: error,
    });
  }
});

// // create a set status route and set the status of the user task to the user in the database with the user id.

// app.post("/setstatus", async (req, res) => {
//   const { user_id, task_id, status } = req.body;
//   if (!mongoose.Types.ObjectId.isValid(user_id)) {
//     return res.send({
//       message: "Invalid user id",
//       status: false,
//     });
//   }
//   if (!mongoose.Types.ObjectId.isValid(task_id)) {
//     return res.send({
//       message: "Invalid task id",
//       status: false,
//     });
//   }
//   try {
//     const task = await Task.findByIdAndUpdate(
//       task_id,
//       {
//         status,
//       },
//       { new: true }
//     );
//     res.send({
//       message: "Status set successfully",
//       status: true,
//     });
//   } catch (error) {
//     res.send({
//       message: "Error setting status, Internal server error",
//       status: false,
//       error: error,
//     });
//   }
// });

app.listen(port, () => {
  console.log(`User Task Management app listening on port ${port}`);
});