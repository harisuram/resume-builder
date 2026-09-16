import { handleOptimizePost } from "@/lib/optimizeServer";

export async function POST(request: Request) {
  return handleOptimizePost(request, {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
  });
}
