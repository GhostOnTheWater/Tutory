import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...");
  
  const exam = await prisma.exam.create({
    data: {
      title: "IELTS Academic Reading Masterclass",
      type: "IELTS",
      questions: {
        create: [
          {
            content: "What is the main advantage of the metric system?",
            options: ["Base 10 calculations", "Historical significance", "Complex fractions", "Regional exclusivity"],
            correctAnswer: "Base 10 calculations"
          },
          {
            content: "Identify the false statement regarding solar energy.",
            options: ["It is renewable", "It produces greenhouse gases", "It requires panels", "It depends on sunlight"],
            correctAnswer: "It produces greenhouse gases"
          }
        ]
      }
    }
  });

  console.log("Seed successful. Exam ID created:");
  console.log(exam.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });