import express from "express";
import cors from "cors";
import "dotenv/config";
import { prisma } from "./lib/prisma.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", service: "Tutory API", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Database offline" });
  }
});

// Get a single exam by ID
app.get("/exams/:id", async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: { 
        questions: true,
        attempts: {
          include: { user: true },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exam" });
  }
});

// Create a new exam
app.post("/exams", async (req, res) => {
  try {
    const { title, type } = req.body;
    const exam = await prisma.exam.create({
      data: { title, type }
    });
    res.status(201).json(exam);
  } catch (error) {
    res.status(400).json({ error: "Failed to create exam" });
  }
});

// Get all exams
app.get("/exams", async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      include: { questions: true }
    });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exams" });
  }
});

// Add a question to an exam
app.post("/exams/:id/questions", async (req, res) => {
  try {
    const { content, options, correctAnswer } = req.body;
    const question = await prisma.question.create({
      data: {
        content,
        options,
        correctAnswer,
        examId: req.params.id
      }
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: "Failed to add question" });
  }
});

// Submit an exam attempt
app.post("/exams/:id/attempts", async (req, res) => {
  try {
    const { answers } = req.body;
    const examId = req.params.id;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true }
    });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    let score = 0;
    exam.questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        score++;
      }
    });

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: "student@tutory.com", name: "Guest Student" }
      });
    }

    const attempt = await prisma.attempt.create({
      data: {
        score,
        examId,
        userId: user.id
      }
    });

    res.status(201).json({ attempt, totalQuestions: exam.questions.length });
  } catch (error) {
    res.status(400).json({ error: "Failed to save attempt" });
  }
});

app.listen(PORT, () => {
  console.log(`Tutory API running on port ${PORT}`);
});