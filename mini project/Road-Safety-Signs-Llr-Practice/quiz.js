const SUPABASE_URL = "https://ittpqmsjywssnffqoonv.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHBxbXNqeXdzc25mZnFvb252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzY3NjksImV4cCI6MjA2NTY1Mjc2OX0.UdnbCkWY2j3JcPSZhEuLJz0-eXX1HQ_daZmTI62zRFU";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Base URL for public bucket
const BUCKET_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/signs/`;

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 30;

// HTML elements
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const imageEl = document.getElementById("questionImage");

// Start quiz
document.getElementById("startQuiz").addEventListener("click", () => {
  const category = document.getElementById("categorySelect").value;
  if (!category) {
    alert("Please select a category!");
    return;
  }
  loadQuestions(category);
});

async function loadQuestions(category) {
  const { data, error } = await supabaseClient
    .from("quiz_questions")
    .select("*")
    .eq("category", category);

  if (error) {
    console.error("Error fetching questions:", error);
    return;
  }

  if (!data.length) {
    alert("No questions found for this category!");
    return;
  }

  // Normalize & shuffle
  questions = data
    .map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
      correct_answer: String(q.correct_answer).trim(),
    }))
    .sort(() => Math.random() - 0.5);

  currentQuestionIndex = 0;
  score = 0;
  scoreEl.innerText = score;

  document.getElementById("category-screen").classList.add("hidden");
  document.getElementById("quiz-container").classList.remove("hidden");

  showQuestion();
}

function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    showResults();
    return;
  }

  const q = questions[currentQuestionIndex];
  questionEl.innerText = q.question;

  // Show image if available
  if (q.image_url && q.image_url.trim() !== "") {
    let fullImageUrl =
      q.image_url.startsWith("http")
        ? q.image_url
        : `${BUCKET_BASE_URL}${q.image_url.replace(/^\//, "")}`;

    imageEl.src = fullImageUrl;
    imageEl.style.display = "block";
    imageEl.onerror = () => (imageEl.style.display = "none");
  } else {
    imageEl.style.display = "none";
  }

  // Show options
  optionsEl.innerHTML = "";
  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.className =
      "option-btn bg-white p-2 rounded border hover:bg-blue-100 w-full mb-2";
    btn.onclick = () => checkAnswer(btn, opt, q.correct_answer, q.options);
    optionsEl.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 30;
  timerEl.innerText = `${timeLeft}s`;

  timer = setInterval(() => {
    timeLeft--;
    timerEl.innerText = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      nextQuestion();
    }
  }, 1000);
}

function checkAnswer(button, selectedText, correctValue, optionsArray) {
  clearInterval(timer);
  document.querySelectorAll("#options button").forEach((b) => (b.disabled = true));

  // Correct answer resolution (index or text)
  let correctText = correctValue;
  if (!isNaN(correctValue)) {
    const idx = Number(correctValue);
    if (idx >= 0 && idx < optionsArray.length) {
      correctText = optionsArray[idx];
    }
  }

  const selected = selectedText.trim().toLowerCase();
  const correct = String(correctText).trim().toLowerCase();

  if (selected === correct) {
    score++;
    scoreEl.innerText = score;
    button.classList.add("bg-green-300");
  } else {
    button.classList.add("bg-red-300");
    document.querySelectorAll("#options button").forEach((b) => {
      if (b.innerText.trim().toLowerCase() === correct) {
        b.classList.add("bg-green-300");
      }
    });
  }

  setTimeout(nextQuestion, 1000);
}

function nextQuestion() {
  currentQuestionIndex++;
  showQuestion();
}

function showResults() {
  document.getElementById("quiz-container").classList.add("hidden");
  document.getElementById("results-screen").classList.remove("hidden");

  const percentage = ((score / questions.length) * 100).toFixed(2);
  document.getElementById("final-score").innerText = score;
  document.getElementById("total-questions").innerText = questions.length;
  document.getElementById("percentage").innerText = percentage;

  const resultTitle = document.getElementById("result-title");
  if (score >= 15) {
    resultTitle.innerText = "🎉 Congratulations! You Passed!";
    resultTitle.className = "text-green-600 font-bold text-2xl";
  } else {
    resultTitle.innerText = "❌ Sorry, You Failed!";
    resultTitle.className = "text-red-600 font-bold text-2xl";
  }
}

// Restart button
document.getElementById("restartQuiz").addEventListener("click", () => {
  document.getElementById("results-screen").classList.add("hidden");
  document.getElementById("category-screen").classList.remove("hidden");
  score = 0;
  currentQuestionIndex = 0;
});

