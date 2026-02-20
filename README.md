# 🎮 Jogo de Tabuada

Jogo educacional de matemática para crianças de 8 a 11 anos.

## 🚀 Funcionalidades

- ✖️ Prática de operações: soma, subtração, multiplicação e divisão
- 📊 Seleção de tabuadas específicas (1 a 10)
- 🔁 Modo repetição (repete pergunta ao errar)
- 🔘 Modo múltipla escolha (12 alternativas)
- 📚 Modo estudo (visualizar tabuadas antes de jogar)
- 🤖 Análise pedagógica por IA (opcional)
- 📱 Responsivo para tablets e smartphones

## 📦 Como usar

1. Abra o arquivo `index.html` no navegador
2. Configure o jogo na tela inicial
3. Jogue e aprenda!

## 🔧 Configuração da IA (Opcional)

Para ativar a análise por IA usando Google Gemini:

1. Acesse https://aistudio.google.com/app/apikey
2. Crie uma nova chave API
3. Abra o arquivo `script.js`
4. Procure por `const API_KEY = '';`
5. Cole sua chave entre as aspas
6. Mude `const useAI = false;` para `const useAI = true;`

**⚠️ IMPORTANTE:** Nunca commite sua chave API no Git!

## 🎨 Ícone para iOS

Para gerar o ícone PNG para iPad/iPhone:

1. Abra `icon-generator.html` no navegador
2. Clique em "Baixar icon.png"
3. Salve na pasta do projeto
4. Adicione o site à tela inicial do iOS

## 📝 Versão

Versão atual: 1.4.1

## 🛡️ Segurança

- Não exponha chaves API no código
- Use variáveis de ambiente para produção
- Mantenha o `.gitignore` atualizado
