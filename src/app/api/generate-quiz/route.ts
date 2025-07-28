import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OpenAI API Key");
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 });
    }

    const chat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = chat.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("Empty response from OpenAI");

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (jsonErr) {
      console.error("JSON parse error:", jsonErr);
      console.error("Raw content received:", raw);
      return NextResponse.json(
        { error: "Failed to parse quiz. LLM response was not valid JSON." },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: parsed });
  } catch (err: any) {
    console.error("API ERROR:", err);

    if (err.code === "invalid_api_key") {
      return NextResponse.json(
        { error: "Invalid OpenAI API Key. Check and replace it in your .env.local file." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Unexpected error occurred. Check server logs." },
      { status: 500 }
    );
  }
}
