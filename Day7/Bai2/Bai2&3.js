const express = require("express");
const app = express();

app.use(express.json());

let courses = [
  { id: 1, title: "Node.js Basics", duration: 30 },
  { id: 2, title: "Express.js API Design", duration: 45 }
];

app.get("/courses", (req, res) => {
  res.json(courses);
});

app.get("/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const course = courses.find((c) => c.id === id);

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  res.json(course);
});

app.post("/courses", (req, res) => {
  const { title, duration } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ message: "Title is required and cannot be empty" });
  }

  if (typeof duration !== "number" || duration <= 0) {
    return res.status(400).json({ message: "Duration must be a number greater than 0" });
  }

  const newCourse = {
    id: Date.now(),
    title: title.trim(),
    duration: duration
  };

  courses.push(newCourse);
  res.status(201).json(newCourse);
});

app.put("/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const course = courses.find((c) => c.id === id);

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  const { title, duration } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "Title cannot be empty" });
    }
    course.title = title.trim();
  }

  if (duration !== undefined) {
    if (typeof duration !== "number" || duration <= 0) {
      return res.status(400).json({ message: "Duration must be a number greater than 0" });
    }
    course.duration = duration;
  }

  res.json(course);
});

app.delete("/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = courses.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Course not found" });
  }

  const deletedCourse = courses.splice(index, 1)[0];
  res.json(deletedCourse);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});