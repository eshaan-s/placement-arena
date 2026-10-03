// ===============================
// ELEMENTS
// ===============================

const startButton = document.getElementById("startButton");
const submitButton = document.getElementById("submitButton");
const nextButton = document.getElementById("nextButton");

const companySelect = document.getElementById("company");
const roleSelect = document.getElementById("role");

const startScreen = document.getElementById("startScreen");
const interviewScreen = document.getElementById("interviewScreen");

const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const progressBar = document.getElementById("progressBar");

const answerInput = document.getElementById("answerInput");

const feedbackCard = document.getElementById("feedbackCard");
const score = document.getElementById("score");
const feedback = document.getElementById("feedback");

const strengths = document.getElementById("strengths");
const improvements = document.getElementById("improvements");


// ===============================
// FRONTEND STATE
// ===============================

let currentQuestionNumber = 0;
let totalQuestions = 5;
let nextQuestion = "";
let finalResults = null;


// ===============================
// START INTERVIEW
// ===============================

startButton.addEventListener("click", async () => {

    const company = companySelect.value;
    const role = roleSelect.value;

    try {

        const response = await fetch("http://localhost:3000/api/start", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                company: company,
                role: role
            })
        });

        const data = await response.json();

        console.log("START RESPONSE:", data);

        currentQuestionNumber = data.questionNumber;
        totalQuestions = data.totalQuestions;

        questionNumber.textContent =
            `Question ${currentQuestionNumber} / ${totalQuestions}`;

        questionText.textContent = data.question;

        progressBar.style.width =
            `${(currentQuestionNumber / totalQuestions) * 100}%`;

        startScreen.classList.add("hidden");
        interviewScreen.classList.remove("hidden");

    } catch (error) {

        console.error("Error starting interview:", error);

        alert("Failed to start interview.");
    }
});


// ===============================
// SUBMIT ANSWER
// ===============================

submitButton.addEventListener("click", async () => {

    const answer = answerInput.value;

    if (answer.trim() === "") {
        alert("Please enter an answer.");
        return;
    }

    try {

        const response = await fetch("http://localhost:3000/api/answer", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                answer: answer
            })
        });

        const data = await response.json();

        console.log("ANSWER RESPONSE:", data);

        // Store the next question
        nextQuestion = data.nextQuestion;

        if (data.final) {
            finalResults = data;
        }

        console.log("NEXT QUESTION STORED:", nextQuestion);

        // Display score
        score.textContent = `${data.score}/10`;

        // Display feedback
        feedback.textContent = data.feedback;


        // Display strengths
        strengths.innerHTML = "";

        data.strengths.forEach((item) => {

            const li = document.createElement("li");

            li.textContent = item;

            strengths.appendChild(li);
        });


        // Display improvements
        improvements.innerHTML = "";

        data.improvements.forEach((item) => {

            const li = document.createElement("li");

            li.textContent = item;

            improvements.appendChild(li);
        });


        // Show feedback
        feedbackCard.classList.remove("hidden");


        // Prevent changing answer after submission
        answerInput.disabled = true;
        submitButton.disabled = true;


        // Final question
        if (data.final) {

            nextButton.textContent = "View Results";

        } else {

            nextButton.textContent = "Next Question";
        }

    } catch (error) {

        console.error("Error submitting answer:", error);

        alert("Failed to submit answer.");
    }
});


// ===============================
// NEXT QUESTION
// ===============================

nextButton.addEventListener("click", () => {

    console.log("NEXT BUTTON CLICKED");


    // ===============================
    // FINAL QUESTION
    // ===============================

    if (finalResults) {

        console.log("INTERVIEW COMPLETE");
        console.log("FINAL RESULTS:", finalResults);

        document.getElementById("totalScore").textContent =
            `${finalResults.totalScore}/50`;

        document.getElementById("averageScore").textContent =
            `${finalResults.averageScore}/10`;


        // Final strengths

        const finalStrengths =
            document.getElementById("finalStrengths");

        finalStrengths.innerHTML = "";

        finalResults.strengths.forEach((item) => {

            const li = document.createElement("li");

            li.textContent = item;

            finalStrengths.appendChild(li);
        });


        // Final improvements

        const finalImprovements =
            document.getElementById("finalImprovements");

        finalImprovements.innerHTML = "";

        finalResults.improvements.forEach((item) => {

            const li = document.createElement("li");

            li.textContent = item;

            finalImprovements.appendChild(li);
        });


        // Switch screens

        interviewScreen.classList.add("hidden");

        document
            .getElementById("resultsScreen")
            .classList.remove("hidden");

        return;
    }


    // ===============================
    // NORMAL NEXT QUESTION
    // ===============================

    console.log("QUESTION TO DISPLAY:", nextQuestion);

    currentQuestionNumber++;

    questionNumber.textContent =
        `Question ${currentQuestionNumber} / ${totalQuestions}`;

    questionText.textContent = nextQuestion;

    progressBar.style.width =
        `${(currentQuestionNumber / totalQuestions) * 100}%`;

    answerInput.value = "";

    answerInput.disabled = false;

    submitButton.disabled = false;

    feedbackCard.classList.add("hidden");
});

const restartButton = document.getElementById("restartButton");

restartButton.addEventListener("click", () => {

    // Reset frontend state
    currentQuestionNumber = 0;
    totalQuestions = 5;
    nextQuestion = "";
    finalResults = null;

    // Clear answer
    answerInput.value = "";

    // Reset buttons
    answerInput.disabled = false;
    submitButton.disabled = false;

    // Hide results
    document
        .getElementById("resultsScreen")
        .classList.add("hidden");

    // Show start screen
    startScreen.classList.remove("hidden");

});