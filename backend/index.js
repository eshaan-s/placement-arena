require("dotenv").config();

const express = require("express");
const app = express();
app.use(express.json()); //to parse the incoming json, so we can PARSE IT to access using req.body



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

console.log(process.env.GEMINI_API_KEY); //test for process dotenv

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
    const company = req.body.company;
    const role = req.body.role;
    const answer = req.body.answer;

    console.log("Company : ", company);
    console.log("Role : ", role);
    console.log("Answer : ", answer);

    const result = await fakeAI();
    console.log(result);

    res.json({
        message: "Answer received successfully!",
        company : company,
        role : role,
        answer : answer,
        aiResult : result
    });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
}); //detects server running

