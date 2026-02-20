// Estado do jogo
const gameConfig = {
    operations: [],
    selectedTables: [],
    totalQuestions: 10,
    repeatOnError: true,
    multipleChoice: false
};

/*
 * CONFIGURAÇÃO DE IA GRATUITA:
 * 
 * Para ativar a análise por IA, você tem 2 opções GRATUITAS:
 * 
 * 1. GOOGLE GEMINI (RECOMENDADO - Melhor qualidade)
 *    - Acesse: https://makersuite.google.com/app/apikey
 *    - Crie uma conta Google (gratuita)
 *    - Gere uma API Key
 *    - Cole a chave na função generateGeminiAnalysis (linha ~580)
 *    - Mude useAI = true na função generateAIAnalysis (linha ~550)
 *    - Limite: 60 requisições/minuto (mais que suficiente)
 * 
 * 2. HUGGING FACE (Alternativa)
 *    - Acesse: https://huggingface.co/settings/tokens
 *    - Crie uma conta (gratuita)
 *    - Gere um token de acesso
 *    - Use a função generateHuggingFaceAnalysis
 * 
 * Se não configurar nenhuma IA, o sistema usa análise baseada em regras (já funciona bem!)
 */

const gameState = {
    startTime: null,
    endTime: null,
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    totalErrors: 0,
    questionStartTime: null
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

// Elementos da tela de estudo
const studyScreen = document.getElementById('study-screen');
const studyBtn = document.getElementById('study-btn');
const backFromStudyBtn = document.getElementById('back-from-study-btn');
const showTableBtn = document.getElementById('show-table-btn');
const playFromStudyBtn = document.getElementById('play-from-study-btn');
const studyTableContainer = document.getElementById('study-table-container');
const studyTableTitle = document.getElementById('study-table-title');
const studyTableContent = document.getElementById('study-table-content');

// Elementos de gerenciamento da chave API
const apiKeyInput = document.getElementById('api-key-input');
const rememberKeyCheckbox = document.getElementById('remember-key');
const clearKeyBtn = document.getElementById('clear-key-btn');
const keyStatus = document.getElementById('key-status');

// Configuração inicial
document.querySelectorAll('#op-soma, #op-subtracao, #op-multiplicacao, #op-divisao').forEach(checkbox => {
    checkbox.addEventListener('change', validateConfig);
});

document.querySelectorAll('.table-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', validateConfig);
});

// Carregar chave API salva ao iniciar
loadSavedApiKey();

// Capturar mudança na opção de repetição
document.getElementById('repeat-on-error').addEventListener('change', function() {
    gameConfig.repeatOnError = this.checked;
});

// Capturar mudança no modo múltipla escolha
document.getElementById('multiple-choice').addEventListener('change', function() {
    gameConfig.multipleChoice = this.checked;
});

// Capturar mudança na ativação da IA
document.getElementById('enable-ai').addEventListener('change', function() {
    const apiKeyContainer = document.getElementById('api-key-container');
    if (this.checked) {
        apiKeyContainer.style.display = 'block';
    } else {
        apiKeyContainer.style.display = 'none';
    }
});

// Salvar chave API quando o usuário digitar
apiKeyInput.addEventListener('input', function() {
    if (rememberKeyCheckbox.checked && this.value.trim()) {
        saveApiKey(this.value.trim());
    }
});

// Atualizar status quando marcar/desmarcar "lembrar"
rememberKeyCheckbox.addEventListener('change', function() {
    if (this.checked && apiKeyInput.value.trim()) {
        saveApiKey(apiKeyInput.value.trim());
    } else if (!this.checked) {
        clearSavedApiKey();
    }
});

// Limpar chave salva
clearKeyBtn.addEventListener('click', function() {
    if (confirm('Tem certeza que deseja remover a chave API salva?')) {
        clearSavedApiKey();
        apiKeyInput.value = '';
        updateKeyStatus();
    }
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

// Event listeners da tela de estudo
studyBtn.addEventListener('click', openStudyScreen);
backFromStudyBtn.addEventListener('click', closeStudyScreen);
showTableBtn.addEventListener('click', showStudyTable);
playFromStudyBtn.addEventListener('click', playFromStudy);

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
    
    // Marcar tempo de início da pergunta
    gameState.questionStartTime = Date.now();
    
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
        
        // Limpar o campo
        answerInput.value = '';
        answerInput.disabled = false;
        submitBtn.disabled = false;
        
        // Manter foco
        answerInput.focus();
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
    const responseTime = Date.now() - gameState.questionStartTime;
    
    if (isCorrect) {
        // Resposta correta
        question.userAnswer = userAnswer;
        question.isCorrect = true;
        question.responseTime = responseTime;
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
        errorRecord.responseTime = responseTime;
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
    
    // Desabilitar botão temporariamente para evitar múltiplos cliques
    submitBtn.disabled = true;
    
    const question = gameState.questions[gameState.currentQuestionIndex];
    const isCorrect = userAnswer === question.correctAnswer;
    const responseTime = Date.now() - gameState.questionStartTime;
    
    if (isCorrect) {
        // Resposta correta
        question.userAnswer = userAnswer;
        question.isCorrect = true;
        question.responseTime = responseTime;
        gameState.answers.push({...question});
        
        // Feedback visual de sucesso
        feedbackMessage.textContent = '✅ Correto!';
        feedbackMessage.className = 'feedback-message success';
        
        // Avançar imediatamente sem delay
        gameState.currentQuestionIndex++;
        
        if (gameState.currentQuestionIndex < gameConfig.totalQuestions) {
            // Limpar campo e mostrar próxima pergunta
            answerInput.value = '';
            showQuestion();
        } else {
            endGame();
        }
        
    } else {
        // Resposta incorreta
        gameState.totalErrors++;
        
        // Registrar erro
        const errorRecord = {...question};
        errorRecord.userAnswer = userAnswer;
        errorRecord.isCorrect = false;
        errorRecord.responseTime = responseTime;
        gameState.answers.push(errorRecord);
        
        if (gameConfig.repeatOnError) {
            // Modo repetição: mostrar erro e repetir pergunta
            feedbackMessage.textContent = '❌ Resposta incorreta! Tente novamente.';
            feedbackMessage.className = 'feedback-message error';
            
            // Limpar campo e manter foco
            answerInput.value = '';
            answerInput.focus();
            submitBtn.disabled = false;
            
        } else {
            // Modo desafio: mostrar erro e avançar
            feedbackMessage.textContent = '❌ Resposta incorreta!';
            feedbackMessage.className = 'feedback-message error';
            
            // Avançar imediatamente
            gameState.currentQuestionIndex++;
            
            if (gameState.currentQuestionIndex < gameConfig.totalQuestions) {
                answerInput.value = '';
                showQuestion();
            } else {
                endGame();
            }
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
    
    // Resetar e mostrar mensagem de carregamento da análise
    const analysisContent = document.getElementById('ai-analysis-content');
    analysisContent.innerHTML = '<div class="loading">🤔 Analisando seu desempenho...</div>';
    
    // Gerar análise por IA (com pequeno delay para mostrar a mensagem)
    setTimeout(() => {
        generateAIAnalysis();
    }, 500);
    
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

async function generateAIAnalysis() {
    const analysisContent = document.getElementById('ai-analysis-content');
    
    try {
        // Preparar dados para análise
        const analysisData = prepareAnalysisData();
        
        // Verificar se o usuário ativou a IA e forneceu a chave
        const enableAI = document.getElementById('enable-ai').checked;
        const apiKey = document.getElementById('api-key-input').value.trim();
        
        if (enableAI && apiKey) {
            await generateGeminiAnalysis(analysisData, analysisContent, apiKey);
        } else {
            // Análise baseada em regras (sem necessidade de API)
            const analysis = generateRuleBasedAnalysis(analysisData);
            analysisContent.innerHTML = analysis;
        }
        
    } catch (error) {
        console.error('Erro ao gerar análise:', error);
        // Fallback para análise baseada em regras
        const analysisData = prepareAnalysisData();
        const analysis = generateRuleBasedAnalysis(analysisData);
        analysisContent.innerHTML = analysis;
    }
}

// Integração com Google Gemini (GRATUITO - 15 requisições/minuto)
async function generateGeminiAnalysis(data, contentElement, apiKey) {
    const API_KEY = apiKey; // Usa a chave fornecida pelo usuário
    
    const prompt = `Você é um professor de matemática especializado em ensino fundamental para crianças de 8 a 11 anos.

Analise o desempenho do aluno no jogo de tabuada e forneça uma análise pedagógica amigável e motivadora.

Dados do desempenho:
- Total de perguntas: ${data.totalQuestions}
- Acertos: ${data.correctAnswers - data.errors}
- Erros: ${data.errors}
- Pontuação: ${data.score}%
- Tempo médio de resposta: ${(data.avgTime / 1000).toFixed(1)} segundos
- Operações praticadas: ${data.operations.join(', ')}
- Tabuadas praticadas: ${data.tables.join(', ')}
- Erros por operação: ${JSON.stringify(data.errorsByOperation)}
- Erros por tabuada: ${JSON.stringify(data.errorsByTable)}

Classifique o aluno em um dos 5 níveis abaixo, com base principalmente na pontuação, número de erros e tempo médio:

- EXCELENTE
- MUITO BOM
- BOM
- PRECISA PRATICAR MAIS
- PRECISA DE MAIS ATENÇÃO

Comece a resposta exatamente com:
"NÍVEL: <nome do nível>"

Depois escreva um feedback curto (máximo 100 palavras) contendo:

1) Um elogio ou incentivo inicial
2) Pontos fortes
3) Onde pode melhorar (se houver erro)
4) 3 dicas simples e práticas
5) Uma frase motivadora final

Use linguagem simples, amigável e adequada para crianças.
Evite termos técnicos.
Se o nível for baixo, seja encorajador e nunca crítico.`;

console.log('Prompt:', prompt);

    try {
        // URL correta da API Gemini com modelo gemini-pro
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro da API:', response.status, errorText);
            throw new Error(`Erro na API do Gemini: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.candidates || !result.candidates[0]) {
            throw new Error('Resposta inválida da API');
        }
        
        const aiText = result.candidates[0].content.parts[0].text;
        
        // Converter Markdown para HTML e exibir
        contentElement.innerHTML = convertMarkdownToHTML(aiText);
        
    } catch (error) {
        console.error('Erro ao chamar Gemini:', error);
        throw error;
    }
}

// Função para converter Markdown básico para HTML
function convertMarkdownToHTML(text) {
    let html = text;
    
    // Negrito: **texto** ou __texto__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Itálico: *texto* ou _texto_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Títulos: ## Título
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
    
    // Listas não ordenadas: - item ou * item
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Listas ordenadas: 1. item
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Quebras de linha duplas = parágrafos
    html = html.split('\n\n').map(para => {
        if (!para.trim().startsWith('<') && para.trim() !== '') {
            return `<p>${para.trim()}</p>`;
        }
        return para;
    }).join('\n');
    
    // Quebras de linha simples
    html = html.replace(/\n/g, '<br>');
    
    return `<div class="ai-formatted-text">${html}</div>`;
}

// Integração alternativa com Hugging Face (GRATUITO)
async function generateHuggingFaceAnalysis(data, contentElement) {
    const API_KEY = 'SUA_CHAVE_HF_AQUI'; // Obtenha em: https://huggingface.co/settings/tokens
    
    const prompt = `Analise este desempenho de matemática de uma criança:
Acertos: ${data.correctAnswers}/${data.totalQuestions}
Erros: ${data.errors}
Operações com dificuldade: ${Object.keys(data.errorsByOperation).join(', ')}
Tabuadas com dificuldade: ${Object.keys(data.errorsByTable).join(', ')}

Forneça uma análise pedagógica breve e motivadora em português.`;

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_length: 300,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            throw new Error('Erro na API do Hugging Face');
        }

        const result = await response.json();
        contentElement.innerHTML = `<div>${result[0].generated_text}</div>`;
        
    } catch (error) {
        console.error('Erro ao chamar Hugging Face:', error);
        throw error;
    }
}

function prepareAnalysisData() {
    const errors = gameState.answers.filter(a => !a.isCorrect);
    const correct = gameState.answers.filter(a => a.isCorrect);
    
    // Análise por operação
    const errorsByOperation = {};
    const timeByOperation = {};
    
    errors.forEach(e => {
        errorsByOperation[e.operation] = (errorsByOperation[e.operation] || 0) + 1;
    });
    
    gameState.answers.forEach(a => {
        if (!timeByOperation[a.operation]) {
            timeByOperation[a.operation] = [];
        }
        timeByOperation[a.operation].push(a.responseTime);
    });
    
    // Análise por tabuada
    const errorsByTable = {};
    errors.forEach(e => {
        errorsByTable[e.operand1] = (errorsByTable[e.operand1] || 0) + 1;
    });
    
    // Tempo médio de resposta
    const avgTime = gameState.answers.reduce((sum, a) => sum + a.responseTime, 0) / gameState.answers.length;
    
    return {
        totalQuestions: gameConfig.totalQuestions,
        correctAnswers: correct.length,
        errors: errors.length,
        score: Math.round((gameConfig.totalQuestions / gameState.answers.length) * 100),
        errorsByOperation,
        errorsByTable,
        timeByOperation,
        avgTime,
        operations: gameConfig.operations,
        tables: gameConfig.selectedTables,
        allAnswers: gameState.answers.map(a => ({
            question: a.questionText,
            userAnswer: a.userAnswer,
            correctAnswer: a.correctAnswer,
            isCorrect: a.isCorrect,
            operation: a.operation,
            operand1: a.operand1,
            operand2: a.operand2,
            time: a.responseTime
        }))
    };
}

function generateRuleBasedAnalysis(data) {
    let analysis = '<div>';
    
    // Análise geral
    if (data.errors === 0) {
        analysis += '<p><strong>🎉 Excelente!</strong> Você acertou todas as perguntas! Continue praticando para manter esse desempenho.</p>';
    } else if (data.score >= 80) {
        analysis += '<p><strong>👏 Muito bom!</strong> Você teve um ótimo desempenho, mas ainda há espaço para melhorar.</p>';
    } else if (data.score >= 60) {
        analysis += '<p><strong>📚 Bom trabalho!</strong> Você está no caminho certo, mas precisa praticar mais algumas áreas.</p>';
    } else {
        analysis += '<p><strong>💪 Continue tentando!</strong> A prática leva à perfeição. Vamos identificar onde você pode melhorar.</p>';
    }
    
    // Análise por operação
    if (Object.keys(data.errorsByOperation).length > 0) {
        analysis += '<p><strong>Operações que precisam de mais atenção:</strong></p><ul>';
        const opNames = {
            'soma': 'Soma',
            'subtracao': 'Subtração',
            'multiplicacao': 'Multiplicação',
            'divisao': 'Divisão'
        };
        
        for (const [op, count] of Object.entries(data.errorsByOperation)) {
            analysis += `<li>${opNames[op]}: ${count} erro(s)</li>`;
        }
        analysis += '</ul>';
    }
    
    // Análise por tabuada
    if (Object.keys(data.errorsByTable).length > 0) {
        analysis += '<p><strong>Tabuadas que precisam de mais prática:</strong></p><ul>';
        const sortedTables = Object.entries(data.errorsByTable).sort((a, b) => b[1] - a[1]);
        
        sortedTables.slice(0, 3).forEach(([table, count]) => {
            analysis += `<li>Tabuada do ${table}: ${count} erro(s)</li>`;
        });
        analysis += '</ul>';
    }
    
    // Análise de tempo
    const avgTimeSec = (data.avgTime / 1000).toFixed(1);
    if (data.avgTime < 3000) {
        analysis += `<p><strong>⚡ Velocidade:</strong> Você está respondendo muito rápido (média de ${avgTimeSec}s)! Ótima agilidade mental.</p>`;
    } else if (data.avgTime < 8000) {
        analysis += `<p><strong>⏱️ Velocidade:</strong> Seu tempo de resposta está bom (média de ${avgTimeSec}s). Continue praticando para ganhar mais agilidade.</p>`;
    } else {
        analysis += `<p><strong>🐢 Velocidade:</strong> Você está levando um tempo para responder (média de ${avgTimeSec}s). Tente praticar mais para ganhar confiança e velocidade.</p>`;
    }
    
    // Recomendações
    analysis += '<p><strong>💡 Recomendações:</strong></p><ul>';
    
    if (data.errors > 0) {
        analysis += '<li>Revise as tabuadas onde você teve mais erros</li>';
        analysis += '<li>Pratique diariamente por 10-15 minutos</li>';
    }
    
    if (data.avgTime > 8000) {
        analysis += '<li>Tente memorizar as respostas mais comuns</li>';
        analysis += '<li>Use técnicas de cálculo mental</li>';
    }
    
    analysis += '<li>Continue jogando para melhorar seu desempenho!</li>';
    analysis += '</ul></div>';
    
    return analysis;
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
    gameState.questionStartTime = null;
    
    // Voltar para tela inicial
    resultScreen.classList.remove('active');
    configScreen.classList.add('active');
}

// ===== FUNÇÕES DA TELA DE ESTUDO =====

function openStudyScreen() {
    configScreen.classList.remove('active');
    studyScreen.classList.add('active');
    studyTableContainer.style.display = 'none';
}

function closeStudyScreen() {
    studyScreen.classList.remove('active');
    configScreen.classList.add('active');
}

function showStudyTable() {
    const operation = document.querySelector('input[name="study-operation"]:checked').value;
    const table = parseInt(document.querySelector('input[name="study-table"]:checked').value);
    
    const lines = generateStudyTable(operation, table);
    
    // Mapear nomes das operações
    const operationNames = {
        'soma': 'Soma',
        'subtracao': 'Subtração',
        'multiplicacao': 'Multiplicação',
        'divisao': 'Divisão'
    };
    
    // Atualizar título
    studyTableTitle.textContent = `📘 Tabuada do ${table} - ${operationNames[operation]}`;
    
    // Gerar HTML das linhas
    studyTableContent.innerHTML = lines.map(line => 
        `<div class="study-table-line">${line}</div>`
    ).join('');
    
    // Mostrar container
    studyTableContainer.style.display = 'block';
    
    // Scroll suave até a tabela
    studyTableContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function generateStudyTable(operation, table) {
    const lines = [];
    
    for (let i = 1; i <= 10; i++) {
        let text;
        
        switch(operation) {
            case 'multiplicacao':
                text = `${table} × ${i} = ${table * i}`;
                break;
            case 'soma':
                text = `${table} + ${i} = ${table + i}`;
                break;
            case 'subtracao':
                if (i <= table) {
                    text = `${table} - ${i} = ${table - i}`;
                }
                break;
            case 'divisao':
                text = `${table * i} ÷ ${table} = ${i}`;
                break;
        }
        
        if (text) lines.push(text);
    }
    
    return lines;
}

function playFromStudy() {
    const operation = document.querySelector('input[name="study-operation"]:checked').value;
    const table = parseInt(document.querySelector('input[name="study-table"]:checked').value);
    
    // Configurar o jogo com a operação e tabuada estudadas
    gameConfig.operations = [operation];
    gameConfig.selectedTables = [table];
    
    // Fechar tela de estudo
    studyScreen.classList.remove('active');
    
    // Iniciar o jogo diretamente
    startGame();
}

// ===== FUNÇÕES DE GERENCIAMENTO DA CHAVE API =====

function loadSavedApiKey() {
    try {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            apiKeyInput.value = savedKey;
            rememberKeyCheckbox.checked = true;
            updateKeyStatus();
        }
    } catch (error) {
        console.error('Erro ao carregar chave salva:', error);
    }
}

function saveApiKey(key) {
    try {
        localStorage.setItem('gemini_api_key', key);
        updateKeyStatus();
    } catch (error) {
        console.error('Erro ao salvar chave:', error);
        keyStatus.textContent = '⚠️ Erro ao salvar chave';
        keyStatus.style.color = '#ff4444';
    }
}

function clearSavedApiKey() {
    try {
        localStorage.removeItem('gemini_api_key');
        updateKeyStatus();
    } catch (error) {
        console.error('Erro ao limpar chave:', error);
    }
}

function updateKeyStatus() {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        keyStatus.textContent = '✓ Chave salva neste navegador';
        keyStatus.style.color = '#4caf50';
        keyStatus.style.display = 'block';
        clearKeyBtn.style.display = 'inline-block';
    } else {
        keyStatus.textContent = '';
        keyStatus.style.display = 'none';
        clearKeyBtn.style.display = 'none';
    }
}
