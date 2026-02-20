# 🔒 Segurança - Chave API Exposta

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

Sua chave API do Google Gemini foi exposta publicamente no Git. Siga estes passos:

## 1️⃣ Revogar a chave antiga

1. Acesse: https://aistudio.google.com/app/apikey
2. Encontre a chave que termina com `...iYO_wow`
3. Clique em "Delete" ou "Revoke"
4. Confirme a exclusão

## 2️⃣ Criar nova chave API

1. No mesmo site, clique em "Create API Key"
2. Copie a nova chave
3. **NÃO cole no código ainda!**

## 3️⃣ Limpar histórico do Git (se já commitou)

```bash
# Remover arquivo do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch script.js" \
  --prune-empty --tag-name-filter cat -- --all

# Forçar push (cuidado!)
git push origin --force --all
```

**OU** se preferir uma solução mais simples:

```bash
# Criar novo repositório limpo
git checkout --orphan new-main
git add -A
git commit -m "Início limpo sem chaves API"
git branch -D main
git branch -m main
git push -f origin main
```

## 4️⃣ Usar a nova chave de forma segura

### Opção A: Arquivo local (não commitado)

Crie um arquivo `config.js` (já está no .gitignore):

```javascript
const GEMINI_API_KEY = 'SUA_NOVA_CHAVE_AQUI';
```

No `index.html`, adicione antes do script.js:
```html
<script src="config.js"></script>
```

No `script.js`, use:
```javascript
const API_KEY = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';
```

### Opção B: Desativar IA

Mantenha `useAI = false` e use apenas a análise baseada em regras (já funciona bem!).

## 5️⃣ Verificar o .gitignore

Certifique-se de que o arquivo `.gitignore` contém:

```
config.js
.env
```

## 6️⃣ Commitar as mudanças

```bash
git add .gitignore README.md SECURITY.md
git commit -m "Adiciona segurança e remove chaves API"
git push
```

## ✅ Checklist de Segurança

- [ ] Chave antiga revogada
- [ ] Nova chave criada
- [ ] Histórico do Git limpo
- [ ] .gitignore configurado
- [ ] Nova chave armazenada de forma segura
- [ ] Código commitado sem chaves

## 📚 Recursos

- [Google API Security Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Git Filter Branch](https://git-scm.com/docs/git-filter-branch)
