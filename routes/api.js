const router = require("express").Router();
const pool = require("../db");
const jwtGenerator = require("../utils/jwtgenerator");
const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");

//TODO: User Registration
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const checkRegisteredUser = await pool.query(
      "SELECT id FROM users WHERE username=$1",
      [username.trim()]
    );
    if (checkRegisteredUser.rows.length > 0) {
      return res.json("User already exists!");
    }
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hashPassword,
    ]);
    res.json({
      type: "success",
      message: "User registration successful",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json("Internal Server Error!");
  }
});

//TODO: User Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const checkUser = await pool.query(
      "SELECT id, username, password FROM users WHERE username=$1",
      [username]
    );
    if (checkUser.rows.length > 0) {
      const userId = checkUser.rows[0].id;
      const userName = checkUser.rows[0].username;
      const userPass = checkUser.rows[0].password;
      const validPassword = await bcrypt.compare(password, userPass);
      if (!validPassword) {
        return res.status(401).json("Incorrect credentials. Please try again.");
      } else {
        const token = jwtGenerator(userId, userName);
        res.json({
          type: "success",
          message: "Login successful",
          token: token,
        });
      }
    } else {
      res.status(401).json("Incorrect credentials. Please try again.");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json("Internal Server Error!");
  }
});

//TODO: Route for retrieveing task
router.get("/tasks", auth, async (req, res) => {
  try {
    const user_id = req.user.id;
    const userTasks = await pool.query(
      "SELECT * FROM tasks WHERE user_id=$1 ORDER BY id ASC",
      [user_id]
    );

    res.json({
      type: "success",
      tasks: userTasks.rows,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json("Internal Server Error!");
  }
});

//TODO: Route for creating task
router.post("/tasks/newtask", auth, async (req, res) => {
  const { title, description, status } = req.body;
  const user_id = req.user.id;

  if (status === "incomplete" || status === "completed") {
    try {
      const checkUser = await pool.query("SELECT id FROM users WHERE id=$1", [
        user_id,
      ]);
      if (checkUser.rows.length === 0) {
        return res.json("Invalid user id");
      }
      const checkDuplicateTask = await pool.query(
        "SELECT id FROM tasks WHERE title=$1 AND user_id=$2",
        [title.trim(), user_id]
      );
      if (checkDuplicateTask.rows.length > 0) {
        return res.json("Task already exists");
      }
      const newTask = await pool.query(
        "INSERT INTO tasks(title, description, status, user_id) VALUES ($1,$2,$3,$4) RETURNING id",
        [title, description, status, user_id]
      );
      if (newTask.rows.length > 0) {
        res.json("New task added");
      } else {
        res.json("Error");
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json("Internal Server Error!");
    }
  } else {
    return res.json("Status must be either incomplete or completed");
  }
});

//TODO: Route for updating task
router.put("/tasks/update/:id", auth, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const user_id = req.user.id;

  if (status === "incomplete" || status === "completed") {
    try {
      const checkTask = await pool.query(
        "SELECT * FROM tasks WHERE id=$1 AND user_id=$2",
        [id, user_id]
      );
      if (checkTask.rows.length === 0) {
        return res.json(
          "Task does not exist or you do not have permission to update status of this task"
        );
      }
      // const checkTaskId = await pool.query("SELECT * FROM tasks WHERE id=$1", [
      //   id,
      // ]);
      // if (checkTaskId.rows.length === 0) {
      //   return res.json("Task does not exist!");
      // }
      const currentTaskStatus = checkTask.rows[0].status;
      if (
        (status === "incomplete" && currentTaskStatus === "completed") ||
        (status === "completed" && currentTaskStatus === "incomplete")
      ) {
        const updateById = await pool.query(
          "UPDATE tasks SET status=$1 WHERE id=$2 RETURNING status",
          [status, id]
        );
        res.json("Task status updated successfully!");
      } else {
        return res.json(`Task status is already ${status}!`);
      }
    } catch (error) {
      console.log(error.messgae);
      res.status(500).send("Internal Server Error!");
    }
  } else {
    return res.json("Status must be either incomplete or completed");
  }
});

//TODO: Route for deleting task
router.delete("/tasks/delete/:id", auth, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  try {
    const checkTask = await pool.query(
      "SELECT * FROM tasks WHERE id=$1 AND user_id=$2",
      [id, user_id]
    );
    if (checkTask.rows.length === 0) {
      return res.json(
        "Task does not exist or you do not have permission to delete this task"
      );
    }
    // const checkTaskId = await pool.query("SELECT * FROM tasks WHERE id=$1", [
    //   id,
    // ]);
    // if (checkTaskId.rows.length === 0) {
    //   return res.json("Task does not exist");
    // }
    const deleteById = await pool.query(
      "DELETE FROM tasks WHERE id=$1 RETURNING id",
      [id]
    );
    res.json("Task deleted successfully");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error!");
  }
});

module.exports = router;
