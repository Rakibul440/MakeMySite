import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);


export const gemini = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL as string,
});