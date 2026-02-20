// Estado do jogo
const gameConfig = {
    operations: [],
    selectedTables: [],
    totalQuestions: 0
};

const gameState = {
    startTime: null,
    endTime: null,
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    timerInterval: null
};

// Elementos DOM
const configScreen = document.getElementById('config-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-btn');
const restartBtn = document.getElementById('restart-btn');
const answerInput = document.getElementById('answer-input');
const validationMessage = document.getElementById('validation-message');

// Configuração inicial
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', validateConfig);
});

document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.qty-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        gameConfig.totalQuestions = parseInt(this.dataset.qty);
        validateConfig();
    });
});

startBtn.addEventListener('click', startGame);
submitBtn.addEventListener('click', submitAnswer);
restartBtn.addEventListener('click', resetGame);

answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        submitAnswer();
    }
});

function validateConfig() {
    const selectedOps = Array.from(document.querySelectorAll('input[type="checkbox"]:not(.table-checkbox):checked'))
        .map(cb => cb.value);
    
    const selectedTables = Array.from(document.querySelectorAll('.table-checkbox:checked'))
        .map(cb => parseInt(cb.value));
    
    gameConfig.operations = selectedOps;
    gameConfig.selectedTables = selectedTables;
    
    // Validação
    let message = '';
    if (gameConfig.operations.length === 0 && gameConfig.selectedTables.length === 0) {
        message = 'Escolha pelo menos uma operação e uma tabuada para começar!';
    } else if (gameConfig.operations.length === 0) {
        message = 'Escolha pelo menos uma operação!';
    } else if (gameConfig.selectedTables.length === 0) {
        message = 'Escolha pelo menos uma tabuada!';
    } else if (gameConfig.totalQuestions === 0) {
        message = 'Escolha a quantidade de perguntas!';
    }
    
    validationMessage.textContent = message;
    
    const isValid = gameConfig.operations.length > 0 && 
                    gameConfig.selectedTables.length > 0 && 
                    gameConfig.totalQuestions > 0;
    startBtn.disabled = !isValid;
}

function startGame() {
    // Gerar perguntas
    gameState.questions = [];
    const recentQuestions = []; // Armazena as últimas 7 perguntas
    
    for (let i = 0; i < gameConfig.totalQuestions; i++) {
        let question;
        let attempts = 0;
        const maxAttempts = 50; // Evitar loop infinito
        
        // Gerar pergunta única (não repetida nas últimas 7)
        do {
            question = generateQuestion();
            attempts++;
        } while (isDuplicateQuestion(question, recentQuestions) && attempts < maxAttempts);
        
        gameState.questions.push(question);
        
        // Adicionar à lista de perguntas recentes
        recentQuestions.push(question);
        
        // Manter apenas as últimas 7 perguntas
        if (recentQuestions.length > 7) {
            recentQuestions.shift();
        }
    }
    
    gameState.currentQuestionIndex = 0;
    gameState.answers = [];
    gameState.startTime = Date.now();
    
    // Iniciar cronômetro
    startTimer();
    
    // Mostrar tela de jogo
    configScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    // Mostrar primeira pergunta
    showQuestion();
}

function generateQuestion() {
    const operation = gameConfig.operations[Math.floor(Math.random() * gameConfig.operations.length)];
    const table = gameConfig.selectedTables[Math.floor(Math.random() * gameConfig.selectedTables.length)];
    const secondNumber = randomInt(1, 10);
    
    let operand1, operand2, correctAnswer, questionText;
    
    switch(operation) {
        case 'soma':
            // Primeiro número é a tabuada selecionada
            operand1 = table;
            operand2 = secondNumber;
            correctAnswer = operand1 + operand2;
            questionText = `${operand1} + ${operand2} = ?`;
            break;
            
        case 'subtracao':
            // Primeiro número é a tabuada selecionada
            // Segundo número deve ser menor ou igual para evitar resultado negativo
            operand1 = table;
            operand2 = randomInt(1, Math.min(table, 10));
            correctAnswer = operand1 - operand2;
            questionText = `${operand1} - ${operand2} = ?`;
            break;
            
        case 'multiplicacao':
            // Primeiro número é a tabuada selecionada
            operand1 = table;
            operand2 = secondNumber;
            correctAnswer = operand1 * operand2;
            questionText = `${operand1} × ${operand2} = ?`;
            break;
            
        case 'divisao':
            // Dividendo é múltiplo da tabuada selecionada
            operand1 = table;
            operand2 = secondNumber;
            const dividend = operand1 * operand2;
            correctAnswer = operand2;
            questionText = `${dividend} ÷ ${operand1} = ?`;
            break;
    }
    
    return {
        operand1,
        operand2,
        operation,
        correctAnswer,
        questionText,
        userAnswer: null,
        isCorrect: false
    };
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isDuplicateQuestion(newQuestion, recentQuestions) {
    // Verifica se a pergunta já existe nas últimas perguntas
    return recentQuestions.some(q => q.questionText === newQuestion.questionText);
}

function showQuestion() {
    const question = gameState.questions[gameState.currentQuestionIndex];
    document.getElementById('question').textContent = question.questionText;
    document.getElementById('current-q').textContent = gameState.currentQuestionIndex + 1;
    document.getElementById('total-q').textContent = gameConfig.totalQuestions;
    answerInput.value = '';
    answerInput.focus();
}

function submitAnswer() {
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) {
        return;
    }
    
    const question = gameState.questions[gameState.currentQuestionIndex];
    question.userAnswer = userAnswer;
    question.isCorrect = userAnswer === question.correctAnswer;
    
    gameState.answers.push(question);
    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex < gameConfig.totalQuestions) {
        showQuestion();
    } else {
        endGame();
    }
}

function startTimer() {
    gameState.timerInterval = setInterval(() => {
        const elapsed = Date.now() - gameState.startTime;
        document.getElementById('timer').textContent = formatTime(elapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(gameState.timerInterval);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function endGame() {
    gameState.endTime = Date.now();
    stopTimer();
    
    gameScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    showResults();
}

function showResults() {
    const totalTime = gameState.endTime - gameState.startTime;
    const correctAnswers = gameState.answers.filter(a => a.isCorrect).length;
    const wrongAnswers = gameState.answers.filter(a => !a.isCorrect).length;
    const score = Math.round((correctAnswers / gameConfig.totalQuestions) * 100);
    
    // Mostrar configuração do jogo
    showGameConfig();
    
    document.getElementById('final-time').textContent = formatTime(totalTime);
    document.getElementById('correct-count').textContent = correctAnswers;
    document.getElementById('wrong-count').textContent = wrongAnswers;
    document.getElementById('final-score').textContent = score;
    
    // Mostrar respostas erradas
    const wrongAnswersDiv = document.getElementById('wrong-answers');
    wrongAnswersDiv.innerHTML = '';
    
    const wrongQuestions = gameState.answers.filter(a => !a.isCorrect);
    
    if (wrongQuestions.length > 0) {
        const title = document.createElement('h3');
        title.textContent = '📝 Respostas Erradas:';
        wrongAnswersDiv.appendChild(title);
        
        wrongQuestions.forEach(q => {
            const item = document.createElement('div');
            item.className = 'wrong-item';
            item.innerHTML = `
                <strong>Pergunta:</strong> ${q.questionText}<br>
                <strong>Sua resposta:</strong> ${q.userAnswer}<br>
                <strong>Resposta correta:</strong> ${q.correctAnswer}
            `;
            wrongAnswersDiv.appendChild(item);
        });
    }
}

function showGameConfig() {
    const configDiv = document.getElementById('game-config-summary');
    
    // Mapear nomes das operações
    const operationNames = {
        'soma': '➕ Soma',
        'subtracao': '➖ Subtração',
        'multiplicacao': '✖️ Multiplicação',
        'divisao': '➗ Divisão'
    };
    
    const operationsList = gameConfig.operations
        .map(op => operationNames[op])
        .join(', ');
    
    const tablesList = gameConfig.selectedTables
        .sort((a, b) => a - b)
        .join(', ');
    
    configDiv.innerHTML = `
        <h3>📋 Configuração do Jogo</h3>
        <div class="config-item">
            <strong>Operações:</strong> ${operationsList}
        </div>
        <div class="config-item">
            <strong>Tabuadas:</strong>
            <div class="config-badges">
                ${gameConfig.selectedTables.sort((a, b) => a - b).map(t => `<span class="config-badge">${t}</span>`).join('')}
            </div>
        </div>
        <div class="config-item">
            <strong>Total de perguntas:</strong> ${gameConfig.totalQuestions}
        </div>
    `;
}

function resetGame() {
    // Limpar estado
    gameState.currentQuestionIndex = 0;
    gameState.questions = [];
    gameState.answers = [];
    gameState.startTime = null;
    gameState.endTime = null;
    
    // Voltar para tela inicial
    resultScreen.classList.remove('active');
    configScreen.classList.add('active');
}
