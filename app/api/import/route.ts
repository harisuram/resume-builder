import { handleImportPost } from "@/lib/importServer";

export async function POST(request: Request) {
  return handleImportPost(request, {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
  });
}
