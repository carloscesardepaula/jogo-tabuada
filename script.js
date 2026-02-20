// Estado do jogo
const gameConfig = {
    operations: [],
    selectedTables: [],
    totalQuestions: 10,
    repeatOnError: true
};

const gameState = {
    startTime: null,
    endTime: null,
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    totalErrors: 0
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
const feedbackMessage = document.getElementById('feedback-message');

// Configuração inicial
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', validateConfig);
});

// Capturar mudança na opção de repetição
document.getElementById('repeat-on-error').addEventListener('change', function() {
    gameConfig.repeatOnError = this.checked;
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
    const selectedOps = Array.from(document.querySelectorAll('input[type="checkbox"]:not(.table-checkbox):not(#repeat-on-error):checked'))
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
    // Limpar estado anterior
    gameState.currentQuestionIndex = 0;
    gameState.answers = [];
    gameState.totalErrors = 0;
    
    // Gerar perguntas
    gameState.questions = [];
    const recentQuestions = []; // Armazena as últimas 7 perguntas
    
    console.log('Iniciando geração de perguntas:', gameConfig.totalQuestions);
    
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
    
    console.log('Perguntas geradas:', gameState.questions.length);
    
    gameState.startTime = Date.now();
    
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
    // Verificar se há pergunta válida
    if (!gameState.questions || gameState.currentQuestionIndex >= gameState.questions.length) {
        console.error('Erro: Índice de pergunta inválido', {
            currentIndex: gameState.currentQuestionIndex,
            totalQuestions: gameState.questions.length
        });
        return;
    }
    
    const question = gameState.questions[gameState.currentQuestionIndex];
    
    if (!question || !question.questionText) {
        console.error('Erro: Pergunta inválida', question);
        return;
    }
    
    // Atualizar interface
    document.getElementById('question').textContent = question.questionText;
    document.getElementById('current-q').textContent = gameState.currentQuestionIndex + 1;
    document.getElementById('total-q').textContent = gameConfig.totalQuestions;
    
    // Limpar e focar no input
    answerInput.value = '';
    answerInput.disabled = false;
    answerInput.focus();
    
    // Reabilitar botão
    submitBtn.disabled = false;
    
    // Limpar mensagem de feedback
    feedbackMessage.textContent = '';
    feedbackMessage.className = 'feedback-message';
}

function submitAnswer() {
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) {
        return;
    }
    
    // Desabilitar botão e input para evitar múltiplos cliques
    submitBtn.disabled = true;
    answerInput.disabled = true;
    
    const question = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (isCorrect) {
        // Resposta correta
        question.userAnswer = userAnswer;
        question.isCorrect = true;
        gameState.answers.push({...question});
        
        // Feedback visual de sucesso (opcional, rápido)
        feedbackMessage.textContent = '✅ Correto!';
        feedbackMessage.className = 'feedback-message success';
        
        // Avançar para próxima pergunta após breve delay
        setTimeout(() => {
            gameState.currentQuestionIndex++;
            
            if (gameState.currentQuestionIndex < gameConfig.totalQuestions) {
                showQuestion();
                // Reabilitar controles
                submitBtn.disabled = false;
                answerInput.disabled = false;
            } else {
                endGame();
            }
        }, 500);
        
    } else {
        // Resposta incorreta
        gameState.totalErrors++;
        
        // Registrar erro
        const errorRecord = {...question};
        errorRecord.userAnswer = userAnswer;
        errorRecord.isCorrect = false;
        gameState.answers.push(errorRecord);
        
        if (gameConfig.repeatOnError) {
            // Modo repetição: mostrar erro e repetir pergunta
            feedbackMessage.textContent = '❌ Resposta incorreta! Tente novamente.';
            feedbackMessage.className = 'feedback-message error';
            
            // Limpar campo de resposta e reabilitar
            answerInput.value = '';
            answerInput.disabled = false;
            submitBtn.disabled = false;
            answerInput.focus();
            
            // Não incrementa currentQuestionIndex - pergunta repete
        } else {
            // Modo desafio: mostrar erro e avançar
            feedbackMessage.textContent = '❌ Resposta incorreta!';
            feedbackMessage.className = 'feedback-message error';
            
            setTimeout(() => {
                gameState.currentQuestionIndex++;
                
                if (gameState.currentQuestionIndex < gameConfig.totalQuestions) {
                    showQuestion();
                    // Reabilitar controles
                    submitBtn.disabled = false;
                    answerInput.disabled = false;
                } else {
                    endGame();
                }
            }, 1000);
        }
    }
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function endGame() {
    gameState.endTime = Date.now();
    
    gameScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    showResults();
}

function showResults() {
    const totalTime = gameState.endTime - gameState.startTime;
    
    // Calcular acertos únicos (baseado nas perguntas planejadas)
    const correctAnswers = gameState.currentQuestionIndex;
    const wrongAnswers = gameState.totalErrors;
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
    
    const repeatMode = gameConfig.repeatOnError ? 'Sim' : 'Não';
    
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
        <div class="config-item">
            <strong>Repetir ao errar:</strong> ${repeatMode}
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
    gameState.totalErrors = 0;
    
    // Voltar para tela inicial
    resultScreen.classList.remove('active');
    configScreen.classList.add('active');
}
