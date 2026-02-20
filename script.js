// Estado do jogo
const gameConfig = {
    operations: [],
    selectedTables: [],
    totalQuestions: 10,
    repeatOnError: true,
    multipleChoice: false
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
const inputMode = document.getElementById('input-mode');
const alternativesMode = document.getElementById('alternatives-mode');
const alternativesGrid = document.getElementById('alternatives-grid');

// Configuração inicial
document.querySelectorAll('#op-soma, #op-subtracao, #op-multiplicacao, #op-divisao').forEach(checkbox => {
    checkbox.addEventListener('change', validateConfig);
});

document.querySelectorAll('.table-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', validateConfig);
});

// Capturar mudança na opção de repetição
document.getElementById('repeat-on-error').addEventListener('change', function() {
    gameConfig.repeatOnError = this.checked;
});

// Capturar mudança no modo múltipla escolha
document.getElementById('multiple-choice').addEventListener('change', function() {
    gameConfig.multipleChoice = this.checked;
});

// Toggle de configurações avançadas
document.getElementById('toggle-advanced').addEventListener('click', function() {
    const advancedSection = document.getElementById('advanced-config');
    const isVisible = advancedSection.style.display !== 'none';
    
    if (isVisible) {
        advancedSection.style.display = 'none';
        this.classList.remove('active');
    } else {
        advancedSection.style.display = 'block';
        this.classList.add('active');
    }
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
    const selectedOps = Array.from(document.querySelectorAll('#op-soma:checked, #op-subtracao:checked, #op-multiplicacao:checked, #op-divisao:checked'))
        .map(cb => cb.value);
    
    const selectedTables = Array.from(document.querySelectorAll('.table-checkbox:checked'))
        .map(cb => parseInt(cb.value));
    
    gameConfig.operations = selectedOps;
    gameConfig.selectedTables = selectedTables;
    
    console.log('Validando config - Operações:', gameConfig.operations);
    
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
        alternatives: [],
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
    
    // Limpar mensagem de feedback
    feedbackMessage.textContent = '';
    feedbackMessage.className = 'feedback-message';
    
    // Mostrar modo apropriado
    if (gameConfig.multipleChoice) {
        // Modo múltipla escolha
        inputMode.style.display = 'none';
        alternativesMode.style.display = 'block';
        
        // Gerar alternativas se ainda não existirem
        if (question.alternatives.length === 0) {
            question.alternatives = generateAlternatives(question.correctAnswer);
        }
        
        // Exibir alternativas
        showAlternatives(question);
    } else {
        // Modo digitação
        inputMode.style.display = 'block';
        alternativesMode.style.display = 'none';
        
        answerInput.value = '';
        answerInput.disabled = false;
        answerInput.focus();
        submitBtn.disabled = false;
    }
}

function generateAlternatives(correctAnswer) {
    const alternatives = new Set();
    alternatives.add(correctAnswer);
    
    // Gerar 11 alternativas incorretas (total de 12)
    while (alternatives.size < 12) {
        let wrongAnswer;
        const strategy = Math.random();
        
        if (strategy < 0.4) {
            // Variação próxima (±1 a ±10)
            const variation = Math.floor(Math.random() * 10) + 1;
            wrongAnswer = correctAnswer + (Math.random() < 0.5 ? variation : -variation);
        } else if (strategy < 0.7) {
            // Múltiplos ou divisores próximos
            const factor = Math.floor(Math.random() * 3) + 2;
            wrongAnswer = Math.random() < 0.5 ? correctAnswer * factor : Math.floor(correctAnswer / factor);
        } else {
            // Valor aleatório na faixa plausível
            const min = Math.max(1, correctAnswer - 30);
            const max = correctAnswer + 30;
            wrongAnswer = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        // Apenas adicionar se for positivo e diferente da correta
        if (wrongAnswer > 0 && wrongAnswer !== correctAnswer) {
            alternatives.add(wrongAnswer);
        }
    }
    
    // Converter para array e embaralhar
    const alternativesArray = Array.from(alternatives);
    return shuffleArray(alternativesArray);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function showAlternatives(question) {
    alternativesGrid.innerHTML = '';
    
    question.alternatives.forEach(alt => {
        const btn = document.createElement('button');
        btn.className = 'alternative-btn';
        btn.textContent = alt;
        btn.dataset.value = alt; // Armazenar valor como data attribute
        btn.onclick = () => selectAlternative(alt, question.correctAnswer);
        alternativesGrid.appendChild(btn);
    });
}

function selectAlternative(selectedAnswer, correctAnswer) {
    // Garantir que ambos sejam números para comparação
    const selectedNum = Number(selectedAnswer);
    const correctNum = Number(correctAnswer);
    const isCorrect = selectedNum === correctNum;
    
    console.log('Selecionado:', selectedNum, 'Correto:', correctNum, 'É correto?', isCorrect);
    
    const buttons = alternativesGrid.querySelectorAll('.alternative-btn');
    
    // Desabilitar todos os botões
    buttons.forEach(btn => {
        btn.disabled = true;
        const btnValue = Number(btn.textContent);
        
        if (btnValue === selectedNum) {
            if (isCorrect) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('wrong');
            }
        }
    });
    
    // Processar resposta
    processAnswer(selectedNum, isCorrect);
}

function processAnswer(userAnswer, isCorrect) {
    const question = gameState.questions[gameState.currentQuestionIndex];
    
    if (isCorrect) {
        // Resposta correta
        question.userAnswer = userAnswer;
        question.isCorrect = true;
        gameState.answers.push({...question});
        
        feedbackMessage.textContent = '✅ Correto!';
        feedbackMessage.className = 'feedback-message success';
        
        // Avançar para próxima pergunta
        setTimeout(() => {
            gameState.currentQuestionIndex++;
            
            if (gameState.currentQuestionIndex < gameConfig.totalQuestions) {
                showQuestion();
            } else {
                endGame();
            }
        }, 800);
        
    } else {
        // Resposta incorreta
        gameState.totalErrors++;
        
        const errorRecord = {...question};
        errorRecord.userAnswer = userAnswer;
        errorRecord.isCorrect = false;
        gameState.answers.push(errorRecord);
        
        if (gameConfig.repeatOnError) {
            feedbackMessage.textContent = '❌ Resposta incorreta! Tente novamente.';
            feedbackMessage.className = 'feedback-message error';
            
            // Gerar novas alternativas para repetição
            setTimeout(() => {
                question.alternatives = generateAlternatives(question.correctAnswer);
                showQuestion();
            }, 1500);
            
        } else {
            feedbackMessage.textContent = '❌ Resposta incorreta!';
            feedbackMessage.className = 'feedback-message error';
            
            setTimeout(() => {
                gameState.currentQuestionIndex++;
                
                if (gameState.currentQuestionIndex < gameConfig.totalQuestions) {
                    showQuestion();
                } else {
                    endGame();
                }
            }, 1500);
        }
    }
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
    
    // Contar erros e acertos
    const wrongAnswers = gameState.answers.filter(a => !a.isCorrect).length;
    const correctAnswers = gameConfig.totalQuestions; // Perguntas completadas
    
    // Pontuação: penaliza pelos erros cometidos
    // Se completou todas as perguntas mas teve erros, a pontuação diminui
    const totalAttempts = gameState.answers.length; // Total de tentativas (acertos + erros)
    const score = Math.round((correctAnswers / totalAttempts) * 100);
    
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
    const choiceMode = gameConfig.multipleChoice ? 'Múltipla Escolha' : 'Digitação';
    
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
            <strong>Modo de resposta:</strong> ${choiceMode}
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
