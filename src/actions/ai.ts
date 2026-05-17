"use server";

import OpenAI from "openai";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummary(jobTitle: string, experienceText: string, language: string = "en") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Basic check for AI usage limits could go here
  
  const prompt = `You are an expert resume writer. Write a professional summary for a ${jobTitle} based on the following experience: ${experienceText}. 
  The summary should be 3-4 sentences long, highly impactful, and tailored to Applicant Tracking Systems. 
  Output language must be in ISO code: ${language}.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a professional resume writer and career coach." },
      { role: "user", content: prompt }
    ],
  });

  const content = response.choices[0].message.content;

  // Log usage
  await prisma.aIUsageLog.create({
    data: {
      userId: session.user.id,
      action: "GENERATE_SUMMARY",
      tokens: response.usage?.total_tokens || 0,
    }
  });

  return content;
}

export async function translateContent(text: string, targetLanguage: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a professional translator specializing in resume and CV translation. Translate the following text to ISO language code ${targetLanguage}. Ensure professional terminology is used.` },
      { role: "user", content: text }
    ],
  });

  return response.choices[0].message.content;
}
