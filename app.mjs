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

// create schema for admin login and admin can add, update, and delete tasks of users with the user id in the database (tasks are stored in the database as an array).

const Admin = mongoose.model("Admin", {
  username: {
    type: String,
    required: true,
    min: 3,
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

app.get("/", (req, res) => {
  res.send("Welcome to User Tasks Management System");
});

// admin signup

app.post("/admin/signup", async (req, res) => {
  const { username, password } = req.body;

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const admin = new Admin({
    username,
    password: hash,
  });

  const adminExist = await Admin.findOne({ username });

  if (adminExist) {
    return res.send({
      message: "Admin already exists",
      status: false,
    });
  }

  try {
    await admin.save();
    res.status(201).send({
      message: "Admin created successfully",
      status: true,
      admin: admin,
    });
  } catch (error) {
    res.send({
      message: "Admin creation failed",
      status: false,
      error: error,
    });
  }
});

// admin login

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.send({
        message: "Admin not found",
        status: false,
      });
    }
    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      return res.send({
        message: "Invalid password",
        status: false,
      });
    }
    res.status(200).send({
      message: "Admin logged in successfully",
      status: true,
      admin: {
        admin_id: admin._id,
        username: admin.username,
      },
    });
  } catch (error) {
    res.send({
      message: "Internal Server Error",
      status: false,
      error: error,
    });
  }
});

// get all users

app.post("/admin/getallusers", async (req, res) => {
  const { admin_id } = req.body;

  if (!admin_id) {
    return res.send({
      message: "Admin id is required",
      status: false,
    });
  }

  if (!mongoose.Types.ObjectId.isValid(admin_id)) {
    return res.send({
      message: "Invalid admin id",
      status: false,
    });
  }

  try {
    const users = await User.find({});
    res.status(200).send({
      message: "Users found successfully",
      status: true,
      users: users,
    });
  } catch (error) {
    res.send({
      message: "Internal Server Error",
      status: false,
      error: error,
    });
  }
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
    return res.send({
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
      return res.send({
        message: "User does not exist",
        status: false,
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send({
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

// create a add task route with by default remarks as pending and save the task to the database with the user id

app.post("/addtask", async (req, res) => {
  const {
    user_id,
    title,
    description,
    priority,
    time,
    remarks = "pending",
    status,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.send({
      message: "Invalid user id",
      status: false,
    });
  }

  if (!user_id || !title || !description || !priority || !time || !status) {
    return res.send({
      message: "Please fill all the fields",
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

// create a update task route and update the task of the user if user wants to update only the title or description or priority or time or status or remarks of the task then update only that field and save the task to the database.

app.post("/updatetask", async (req, res) => {
  const { task_id, title, description, priority, time, status } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(
      { _id: task_id },
      {
        title: title,
        description: description,
        priority: priority,
        time: time,
        status: status,
      },
      { new: true }
    );
    if (!mongoose.Types.ObjectId.isValid(task_id)) {
      return res.send({
        message: "Invalid task id",
        status: false,
      });
    }

    if (!task) {
      return res.send({
        message: "Task not found",
        status: false,
      });
    }

    if (
      title === "" ||
      description === "" ||
      priority === "" ||
      time === "" ||
      status === ""
    ) {
      return res.send({
        message: "Please fill all the fields",
        status: false,
      });
    }

    return res.send({
      message: "Task updated successfully",
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
      message: "Error updating task, Internal server error",
      status: false,
      error: error,
    });
  }
});

// create a delete task route and delete the task of the user from the database with the user id

app.post("/deletetask", async (req, res) => {
  const { task_id } = req.body;
  if (!mongoose.Types.ObjectId.isValid(task_id)) {
    return res.send({
      message: "Invalid task id",
      status: false,
    });
  }

  if (!task_id) {
    return res.send({
      message: "Please fill all the fields",
      status: false,
    });
  }

  try {
    const task = await Task.findByIdAndDelete(task_id);
    if (!task) {
      return res.send({
        message: "Task not found",
        status: false,
      });
    }
    return res.send({
      message: "Task deleted successfully",
      status: true,
      task: task,
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
  const { task_id, remarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(task_id)) {
    return res.send({
      message: "Invalid task id",
      status: false,
    });
  }

  // if (!remarks) {
  //   return res.send({
  //     message: "Please fill all the fields",
  //     status: false,
  //   });
  // }

  try {
    const task = await Task.findByIdAndUpdate(
      { _id: task_id },
      {
        remarks: remarks,
      },
      { new: true }
    );
    if (!task) {
      return res.send({
        message: "Task not found",
        status: false,
      });
    }
    return res.send({
      message: "Remarks given successfully",
      status: true,
      task: task,
    });
  } catch (error) {
    res.send({
      message: "Error giving remarks, Internal server error",
      status: false,
      error: error,
    });
  }
});

app.listen(port, () => {
  console.log(`User Task Management app listening on port ${port}`);
});
