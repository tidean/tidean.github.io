// App state
let currentGrade = null;
let currentQuestionIndex = 0;
let selectedOption = null;
let questionsAnswered = 0;
let correctAnswers = 0;
let currentQuestions = [];
let questionsData = {};

// DOM elements
const selectionScreen = document.getElementById('selectionScreen');
const startQuizBtn = document.getElementById('startQuizBtn');
const backToSelectionBtn = document.getElementById('backToSelectionBtn');
const gradeButtons = document.querySelectorAll('.grade-btn');
const quizContainer = document.getElementById('quizContainer');
const questionCard = document.getElementById('questionCard');
const questionNumber = document.getElementById('questionNumber');
const currentGradeDisplay = document.getElementById('currentGrade');
const questionText = document.getElementById('questionText');
const questionImage = document.getElementById('questionImage');
const questionImg = document.getElementById('questionImg');
const optionsContainer = document.getElementById('optionsContainer');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const feedback = document.getElementById('feedback');
const questionsAnsweredDisplay = document.getElementById('questionsAnswered');
const correctAnswersDisplay = document.getElementById('correctAnswers');
const accuracyDisplay = document.getElementById('accuracy');
const questionCountSelect = document.getElementById('questionCountSelect');

let sessionQuestions = [];
let totalQuestionsInSession = 0;

// Load questions data from JSON file
async function loadQuestionsData() {
    try {
        const response = await fetch('data/question_bank.json');
        questionsData = await response.json();
        console.log('Questions loaded successfully');
    } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to sample data if JSON file not found
        questionsData = {
            3: [
                {
                    question: "What is 7 + 5?",
                    options: ["10", "11", "12", "13"],
                    correct: 2,
                    topic: "addition"
                },
                {
                    question: "What is 15 - 8?",
                    options: ["6", "7", "8", "9"],
                    correct: 1,
                    topic: "subtraction"
                }
            ],
            4: [
                {
                    question: "What is 24 ÷ 6?",
                    options: ["3", "4", "5", "6"],
                    correct: 1,
                    topic: "division"
                }
            ]
        };
    }
}

// Initialize the app
async function init() {
    await loadQuestionsData();

    // Event listeners
    let selectedGrade = null;
    gradeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedGrade = btn.dataset.grade;
            gradeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    startQuizBtn.addEventListener('click', () => {
        if (!selectedGrade) {
            alert('Please select a grade first!');
            return;
        }
        selectGrade(selectedGrade);
        selectionScreen.style.display = 'none';
        quizContainer.style.display = 'block';
    });

    backToSelectionBtn.addEventListener('click', () => {
        quizContainer.style.display = 'none';
        selectionScreen.style.display = 'block';
        // Reset grade selection
        gradeButtons.forEach(b => b.classList.remove('active'));
        selectedGrade = null;
        // Optionally reset stats and UI
        questionsAnsweredDisplay.textContent = '0';
        correctAnswersDisplay.textContent = '0';
        accuracyDisplay.textContent = '0%';
        document.getElementById('resultsTableContainer').innerHTML = '';
        document.getElementById('reviewDetail').innerHTML = '';
        questionText.innerHTML = 'Loading question...';
        questionImage.style.display = 'none';
        optionsContainer.innerHTML = '';
        submitBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        questionNumber.textContent = '';
        feedback.style.display = 'none';
    });

    submitBtn.addEventListener('click', submitAnswer);
    nextBtn.addEventListener('click', nextQuestion);
}

function selectGrade(grade) {
    currentGrade = grade;
    currentQuestions = [...questionsData[grade]]; // Copy questions

    // Update UI
    gradeButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-grade="${grade}"]`).classList.add('active');

    currentGradeDisplay.textContent = `Grade ${grade}`;
    quizContainer.classList.add('active');
    questionCard.style.display = 'block';
    document.getElementById('resultsTableContainer').style.display = 'none';
    document.getElementById('reviewDetail').style.display = 'none';

    // Reset stats
    questionsAnswered = 0;
    correctAnswers = 0;
    updateStats();
    totalQuestionsInSession = parseInt(questionCountSelect.value, 10) || currentQuestions.length;
    sessionQuestions = pickRandomQuestions(currentQuestions, totalQuestionsInSession);
    currentQuestionIndex = 0;
    loadSessionQuestion();
}

function pickRandomQuestions(questionsArray, count) {
    const arr = [...questionsArray];
    const picked = [];
    for (let i = 0; i < count && arr.length > 0; i++) {
        const idx = Math.floor(Math.random() * arr.length);
        picked.push(arr[idx]);
        arr.splice(idx, 1);
    }
    return picked;
}

function loadSessionQuestion() {
    if (currentQuestionIndex >= sessionQuestions.length) {
        // Show score percentage when quiz is complete
        const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
        let endMsg = '';
        let endImg = '';
        if (accuracy >= 80) {
            endMsg = 'Very good!';
            endImg = 'images/good_job.jpg';
        } else if (accuracy >= 50) {
            endMsg = 'Keep it up!';
            endImg = 'images/keep_it_up.jpg';
        } else {
            endMsg = 'Try harder!';
            endImg = 'images/try_harder.jpg';
        }
        // Results screen
        questionText.innerHTML = `Quiz complete!<br>Your score: ${accuracy}%<br><span style="font-size:1.3em;font-weight:bold;color:#4facfe;">${endMsg}</span>`;
        questionImage.style.display = 'block';
        questionImg.src = endImg;
        optionsContainer.innerHTML = '';
        submitBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        questionNumber.textContent = '';
        feedback.style.display = 'none';

        // Hide question card and show results containers

        // if commented out, it will show the image and message
        // questionCard.style.display = 'none';

        document.getElementById('resultsTableContainer').style.display = 'block';
        document.getElementById('reviewDetail').style.display = 'none';

        // Build results table
        let tableHtml = `<table id='resultsTable'>`;
        tableHtml += `<thead><tr><th>#</th><th>Question</th><th>Your Answer</th><th>Correct Answer</th></tr></thead><tbody>`;
        sessionQuestions.forEach((q, i) => {
            let userAns = typeof q.userSelected !== 'undefined' ? q.options[q.userSelected] : '-';
            let correctAns = q.options[q.correct];
            let rowClass = '';
            if (typeof q.userSelected !== 'undefined') {
                rowClass = q.userSelected === q.correct ? 'correct' : 'incorrect';
            }
            tableHtml += `<tr class='${rowClass}' onclick='window.showReviewDetail(${i})'>`;
            tableHtml += `<td>${i + 1}</td>`;
            tableHtml += `<td>${q.question.replace(/<[^>]+>/g, '')}</td>`;
            tableHtml += `<td>${userAns}</td>`;
            tableHtml += `<td>${correctAns}</td>`;
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table>`;
        document.getElementById('resultsTableContainer').innerHTML = tableHtml;
        document.getElementById('reviewDetail').innerHTML = '';
        // Render MathJax in the results table
        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise([document.getElementById('resultsTableContainer')]).catch(() => { });
        }

        // Add global function for showing review detail
        window.showReviewDetail = function (index) {
            const q = sessionQuestions[index];
            let html = `<h3>Question #${index + 1}</h3>`;
            html += `<div class='review-question'>${q.question}</div>`;
            if (q.image) {
                html += `<div class='review-image'><img src='${q.image}'></div>`;
            }
            html += `<div class='review-answer'><strong>Your Answer:</strong> <span class='${q.userSelected === q.correct ? 'review-correct' : 'review-incorrect'}'>${typeof q.userSelected !== 'undefined' ? q.options[q.userSelected] : '-'}</span></div>`;
            html += `<div class='review-answer'><strong>Correct Answer:</strong> <span class='review-correct'>${q.options[q.correct]}</span></div>`;
            html += `<div class='review-options'>`;
            q.options.forEach((opt, idx) => {
                let optClass = '';
                if (idx === q.correct) optClass = 'correct';
                else if (idx === q.userSelected) optClass = 'incorrect';
                html += `<span class='${optClass}'>${opt}</span>`;
            });
            html += `</div>`;
            document.getElementById('reviewDetail').innerHTML = html;
            document.getElementById('reviewDetail').style.display = 'block';
            if (typeof MathJax !== 'undefined') {
                MathJax.typesetPromise([document.getElementById('reviewDetail')]).catch(() => { });
            }
        };
        return;
    }
    const question = sessionQuestions[currentQuestionIndex];
    questionNumber.textContent = `Question #${currentQuestionIndex + 1} of ${sessionQuestions.length}`;
    questionText.innerHTML = question.question;
    if (question.image) {
        questionImg.src = question.image;
        questionImage.style.display = 'block';
    } else {
        questionImage.style.display = 'none';
    }
    optionsContainer.innerHTML = '';
    selectedOption = null;
    feedback.style.display = 'none';
    submitBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';
    // If this is the last question, change nextBtn text to 'Submit'
    if (currentQuestionIndex === sessionQuestions.length - 1) {
        nextBtn.textContent = 'Submit';
    } else {
        nextBtn.textContent = 'Next Question';
    }
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.innerHTML = option;
        optionElement.dataset.index = index;
        optionElement.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionElement);
    });
    window.currentQuestion = question;
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise([questionText, optionsContainer]).catch((err) => console.log(err));
    }
}

function selectOption(index) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Select new option
    selectedOption = index;
    document.querySelector(`[data-index="${index}"]`).classList.add('selected');
}

function submitAnswer() {
    if (selectedOption === null) {
        alert('Please select an answer first!');
        return;
    }

    const isCorrect = selectedOption === window.currentQuestion.correct;
    questionsAnswered++;
    // Save user's answer for review
    sessionQuestions[currentQuestionIndex].userSelected = selectedOption;

    if (isCorrect) {
        correctAnswers++;
        feedback.innerHTML = 'Correct! Well done! 🎉';
        feedback.className = 'feedback correct';
        document.querySelector(`[data-index="${selectedOption}"]`).classList.add('correct');
    } else {
        feedback.innerHTML = `Incorrect. The correct answer is: ${window.currentQuestion.options[window.currentQuestion.correct]}`;
        feedback.className = 'feedback incorrect';
        document.querySelector(`[data-index="${selectedOption}"]`).classList.add('incorrect');
        document.querySelector(`[data-index="${window.currentQuestion.correct}"]`).classList.add('correct');
    }

    feedback.style.display = 'block';

    // Render MathJax in feedback if present
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise([feedback]).catch((err) => console.log(err));
    }
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';

    // Disable option selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });

    updateStats();
}

function nextQuestion() {
    // Re-enable option selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'auto';
    });
    currentQuestionIndex++;
    loadSessionQuestion();
}

function updateStats() {
    questionsAnsweredDisplay.textContent = questionsAnswered;
    correctAnswersDisplay.textContent = correctAnswers;
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
    accuracyDisplay.textContent = accuracy + '%';
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);