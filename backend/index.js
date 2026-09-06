require("dotenv").config();

const express = require("express");
const app = express();
app.use(express.json()); //to parse the incoming json, so we can PARSE IT to access using req.body

let interview = {
    company: null,
    role: null,
    currentQuestion: 0,
    totalQuestions: 5,
    questions: [],
    scores: [],
    answers: [],
    finished : false
};

let ai;

async function setupGemini() {
    const { GoogleGenAI } = await import("@google/genai");

    ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });
} //gemini setup

//FUNCTIONS:
function fakeAI() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("AI has finished thinking!");
        }, 2000);
    });
}

async function getTestData() {
    const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");

    const data = await response.json();

    return data;
}

//ROUTES:

app.get("/", (req, res) => {
    res.send("Placement Arena backend is alive!");
}); //check if server is alive

app.get("/api/test", (req, res) => {
    res.json({
        message: "API is working",
        project: "Placement Arena"
    });
}); //test api

app.get("/api/external-test", async (req, res) => {
    const data = await getTestData(); //coming back to backend

    res.json(data); //sending to frontend (or) browser
}); //test external-api

app.post("/api/answer", async (req, res) => {
    const answer = req.body.answer;

    if (!interview.company || interview.currentQuestion === 0) {
    return res.status(400).json({
        error: "No active interview."
    });
    }

    if (interview.finished) {
        return res.status(400).json({
            error: "Interview has already been completed."
        });
    }

    console.log("Question:", interview.currentQuestion);
    console.log("Answer:", answer);

    

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",

           contents: `
                You are conducting a technical interview.

                Company: ${interview.company}
                Role: ${interview.role}

                Current question:
                ${interview.questions[interview.currentQuestion - 1]}

                Candidate answer:
                ${answer}

                This is question ${interview.currentQuestion} of ${interview.totalQuestions}.

                If this is the final question, do not generate another question.
                Set nextQuestion to an empty string.

                Evaluate the candidate's answer.

                Give constructive and specific feedback.
                Score the answer from 0 to 10.

                Identify the candidate's main strengths and areas for improvement.

                Generate the next technical interview question based on
                the candidate's answer and the role.

                The next question MUST:
                - Be answerable in 1–3 minutes using words only.
                - Test conceptual understanding, reasoning, or technical knowledge.
                - Be ONE simple question.
                - Be concise (maximum 2 sentences).
                - NOT require writing code or solving a programming problem.
                - NOT be a LeetCode-style question.
            `,

            config: {
                responseMimeType: "application/json",

                responseSchema: {
                    type: "object",

                    properties: {
                        feedback: {
                            type: "string"
                        },

                        score: {
                            type: "integer",
                            minimum: 0,
                            maximum: 10
                        },

                        nextQuestion: {
                            type: "string"
                        },

                        strengths: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        },

                        improvements: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        }
                    },

                    required: [
                        "feedback",
                        "score",
                        "nextQuestion",
                        "strengths",
                        "improvements"
                    ]
                }
            }
        });

        const evaluation = JSON.parse(response.text);

        interview.answers.push(answer);

        interview.scores.push(evaluation.score);

        if (interview.currentQuestion === interview.totalQuestions) {
            const totalScore = interview.scores.reduce(
                (sum, score) => sum + score,
                0
            );

            const averageScore = totalScore / interview.totalQuestions;

            interview.finished = true;

            res.json({
                ...evaluation,
                final: true,
                totalScore: totalScore,
                averageScore: averageScore,
                questionNumber: interview.currentQuestion,
                totalQuestions: interview.totalQuestions
            });

            return;
        }

        interview.currentQuestion++;

        interview.questions.push(evaluation.nextQuestion);

        res.json({
            ...evaluation,
            final: false,
            questionNumber: interview.currentQuestion,
            totalQuestions: interview.totalQuestions
});

    } catch (error) {
        console.error("Gemini error:", error);

        res.status(500).json({
            error: "Failed to evaluate answer."
        });
    }
});

app.get("/api/gemini-test", async (req, res) => {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: "Say hello to Placement Arena in one sentence." //prompt
    });

    res.json({
        reply: response.text
    });
});

app.post("/api/start", async (req, res) => {
    const company = req.body.company;
    const role = req.body.role;

    interview = {
        company: company,
        role: role,
        currentQuestion: 0,
        totalQuestions: 5,
        questions: [],
        scores: [],
        answers: [],
        finished : false
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",

            contents: `
                You are conducting a TEXT-BASED TECHNICAL INTERVIEW.

                Company: ${company}
                Role: ${role}

                Generate ONE short interview question.

                IMPORTANT:
                The candidate will answer by TYPING A SPOKEN-STYLE RESPONSE.
                This is NOT a coding interview.

                The question MUST:
                - Be answerable in 1 to 3 minutes using words only.
                - Test conceptual understanding, reasoning, or technical knowledge.
                - Be ONE simple question.
                - Be concise (maximum 2 sentences).

                STRICTLY DO NOT:
                - Ask the candidate to write code.
                - Ask the candidate to implement anything.
                - Ask the candidate to solve a programming problem.
                - Give an array, string, tree, graph, or other coding problem.
                - Ask for an algorithm.
                - Ask for time complexity or space complexity.
                - Ask the candidate to walk through an implementation.
                - Give a multi-step or multi-part problem.
                - Give a LeetCode-style question.

                Examples of GOOD questions:
                - "What is the difference between a process and a thread?"
                - "What is normalization in a relational database, and why is it useful?"
                - "What is polymorphism in object-oriented programming?"
                - "What happens when you enter a URL into a web browser?"
                - "What is the difference between TCP and UDP?"

                Return ONLY the question. Do not provide an answer or explanation.
                `
        });

        const question = response.text;

        interview.questions.push(question);
        interview.currentQuestion = 1;

        res.json({
            question: question,
            questionNumber: interview.currentQuestion,
            totalQuestions: interview.totalQuestions
        });

    } catch (error) {
        console.error("Gemini error:", error);

        res.status(500).json({
            error: "Failed to start interview."
        });
    }
});

setupGemini().then(() => {
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
});

