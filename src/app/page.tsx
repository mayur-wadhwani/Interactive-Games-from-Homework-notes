"use client";

import React, { useState } from "react";
import Card from "../components/ui/card";
import Button from "../components/ui/button";
import Progress from "../components/ui/progress";
import Input from "../components/ui/input";

// Helper for relevant image/icon (step 3 will improve this)
function getRelevantImage(question: string) {
  const keywords = [
    "animal", "science", "math", "history", "geography", "technology", "plant", "space", "computer", "physics", "chemistry", "biology", "earth", "ocean", "music", "art", "literature"
  ];
  const lower = question.toLowerCase();
  for (const word of keywords) {
    if (lower.includes(word)) return `https://source.unsplash.com/600x200/?${word}`;
  }
  // fallback to an education icon
  return "https://img.icons8.com/ios-filled/100/4a90e2/education.png";
}

export default function QuizDashboard() {
  const [contentInput, setContentInput] = useState("");
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const generateQuestions = async (rawContent) => {
    const prompt = `You are an expert quiz maker. Your job is to create a 15-question quiz using ONLY the content provided below. 
- Use a mix of MCQs, Fill in the blanks, and One-word answer types.
- Return ONLY JSON in this exact format:

[
  {
    "type": "mcq" | "fill" | "one-word",
    "question": "string",
    "options": ["A", "B", "C", "D"], // only for mcq
    "answer": "string",
    "explanation": "string"
  }
]

Here is the content:
"""
${rawContent}
"""`;

    const response = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.questions;
  };

  const handleStart = async () => {
    if (!contentInput.trim()) {
      alert("Please enter content to generate the quiz.");
      return;
    }
    try {
      setLoading(true);
      const generated = await generateQuestions(contentInput);
      if (!generated || generated.length === 0) {
        alert("No valid questions generated.");
        return;
      }
      setQuestions(generated);
      setCurrent(0);
      setScore(0);
      setAnswers([]);
      setFeedback(null);
      setShowFeedback(false);
    } catch (err) {
      alert("Error generating quiz: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (response) => {
    const currentQuestion = questions[current];
    const correct =
      response.toString().trim().toLowerCase() ===
      currentQuestion.answer.toString().trim().toLowerCase();

    setAnswers((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        response,
        correct,
        explanation: currentQuestion.explanation,
      },
    ]);

    if (correct) setScore((prev) => prev + 1);

    setFeedback({ correct, explanation: currentQuestion.explanation });
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setCurrent((prev) => prev + 1);
      setInputValue("");
    }, correct ? 1500 : 2500);
  };

  // --- UI: First page for content input ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 flex flex-col items-center w-full max-w-lg">
          <p className="text-lg font-semibold">Generating quiz… please wait.</p>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Your Quiz</h2>
          <label className="block mb-2 font-medium text-gray-700" htmlFor="contentInput">
            Enter the text/content to generate your quiz:
          </label>
          <textarea
            id="contentInput"
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            className="w-full h-40 border rounded p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Paste your study material, notes, or any text here..."
          />
          <div className="flex justify-center">
            <Button onClick={handleStart} className="mt-2 px-8 py-2 text-lg">Generate Quiz</Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- Quiz in progress ---
  if (current < questions.length) {
    const currentQuestion = questions[current];
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 w-full max-w-2xl">
          <Progress value={((current + 1) / questions.length) * 100} className="mb-6" />
          <h2 className="text-xl font-semibold mb-4 text-center">Question {current + 1} of {questions.length}</h2>
          <div className="flex justify-center mb-6">
            <img
              src={getRelevantImage(currentQuestion.question)}
              alt="Relevant"
              className="rounded-lg shadow-md object-cover w-full max-w-xl h-48 border"
              loading="lazy"
            />
          </div>
          <p className="mb-6 whitespace-pre-line text-lg text-gray-800 text-center">{currentQuestion.question}</p>

          {currentQuestion.type === "mcq" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {currentQuestion.options.map((opt, idx) => (
                <Button key={idx} onClick={() => handleAnswer(opt)} className="w-full py-3 text-base">{opt}</Button>
              ))}
            </div>
          )}

          {["fill", "one-word"].includes(currentQuestion.type) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputValue) handleAnswer(inputValue);
              }}
              className="flex gap-2 mb-4"
            >
              <Input
                name="answer"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your answer"
                required
                className="flex-1 py-2 px-3 text-base"
              />
              <Button type="submit" className="px-6 py-2 text-base">Submit</Button>
            </form>
          )}

          {showFeedback && (
            <div className={`mt-4 p-4 rounded-lg text-center text-lg font-medium ${feedback.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {feedback.correct ? "Correct!" : (
                <>
                  <p>Incorrect.</p>
                  <p className="text-base mt-2">{feedback.explanation}</p>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // --- Results page ---
  const getRank = (score, total) => {
    const percent = (score / total) * 100;
    if (percent === 100) return "Quiz Master 🏆";
    if (percent >= 80) return "Expert 🎓";
    if (percent >= 60) return "Advanced 👍";
    if (percent >= 40) return "Intermediate 🙂";
    if (percent >= 20) return "Beginner 👶";
    return "Try Again!";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Quiz Completed!</h2>
        <p className="text-lg font-semibold text-center mb-2">Your Score: {score} / {questions.length}</p>
        <p className="text-center text-xl mb-6">
          <span className="inline-block px-4 py-2 bg-blue-100 rounded-full">{getRank(score, questions.length)}</span>
        </p>
        <ul className="mt-4 space-y-4">
          {answers.map((ans, i) => (
            <li key={i} className={`p-4 rounded ${ans.correct ? "bg-green-50" : "bg-red-50"}`}>
              <strong>{ans.question}</strong> - {ans.correct ? "Correct" : `Wrong (${ans.response})`}<br />
              <span className="text-sm text-gray-600">{ans.explanation}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-center mt-8">
          <Button onClick={() => {
            setQuestions([]);
            setCurrent(0);
            setScore(0);
            setAnswers([]);
            setFeedback(null);
            setShowFeedback(false);
            setInputValue("");
            setContentInput("");
          }} className="px-8 py-2 text-lg">
            Restart Quiz
          </Button>
        </div>
      </Card>
    </div>
  );
}