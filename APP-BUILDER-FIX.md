# 🔧 Fix: App Builder Features (Header Fixed & Navigation Full Height)

**Data:** 27 de Outubro de 2025
**Problema:** Features do App Builder não funcionam após reorganização de services

---

## 🎯 Problema Identificado

Após mover o `layout-store.service.ts` para `src/app/core/services/layout/`, as features:
- ✅ **Header position fixed**
- ✅ **Navigation full height**

... podem não estar funcionando porque a aplicação precisa ser **rebuilded e recarregada**.

---

## ✅ Solução Rápida

### Passo 1: Limpar Build Anterior

```bash
cd "/home/vitorafgomes/Downloads/WB0573SK0 (2)/SmartAdmin_v5.5.0/Angular/Angular/smart-management-ui"

# Limpar cache e builds anteriores
rm -rf dist/ .angular/
```

### Passo 2: Rebuild da Aplicação

```bash
npm run build
```

**Resultado esperado:** ✅ Build bem-sucedido

### Passo 3: Recarregar Aplicação no Navegador

1. Se estiver em modo desenvolvimento (`ng serve`):
   ```bash
   # Parar o servidor (Ctrl+C)
   # Iniciar novamente
   npm start
   ```

2. No navegador:
   - Abra DevTools (F12)
   - Clique com botão direito no ícone de reload
   - Selecione **"Empty Cache and Hard Reload"** (Limpar cache e recarregar forçado)
   - Ou use: `Ctrl+Shift+R` (Linux/Windows) / `Cmd+Shift+R` (Mac)

### Passo 4: Testar Features

1. Abra a aplicação
2. Clique no ícone de **App Builder** (canto superior direito)
3. Teste os checkboxes:
   - ✅ **Header position fixed**
   - ✅ **Navigation full height**

---

## 🔍 Verificação Técnica

### 1. Verificar se Service Está Carregado

Abra o console do navegador (F12 → Console) e execute:

```javascript
// Verificar se o LayoutService está injetado
const layout = document.querySelector('app-root').__ngContext__
console.log(layout);
```

### 2. Verificar Estado do Layout

```javascript
// Deve retornar o estado atual
localStorage.getItem('__SMART_ADMIN_ANGULAR_CONFIG__')
```

**Exemplo de retorno esperado:**
```json
{
  "theme": "light",
  "headerFixed": false,
  "navFull": false,
  "navFixed": false,
  "navCollapsed": false,
  "navMinified": false,
  "darkNavigation": true,
  "colorblindMode": false,
  "highContrastMode": false,
  "selectedTheme": "default"
}
```

### 3. Verificar Classes CSS Aplicadas

Quando você ativa "Header position fixed", a classe `set-header-fixed` deve ser adicionada ao `<html>`:

```javascript
// No console
document.documentElement.classList.contains('set-header-fixed')
// Deve retornar: true (quando ativado)
```

Classes esperadas:
- `headerFixed` → `set-header-fixed`
- `navFull` → `set-nav-full`
- `navFixed` → `set-nav-fixed`
- `navCollapsed` → `set-nav-collapsed`
- `navMinified` → `set-nav-minified`
- `darkNavigation` → `set-nav-dark`

---

## 🐛 Troubleshooting Avançado

### Problema: Classes CSS não são aplicadas

**Diagnóstico:**

1. Verifique o arquivo `layout-store.service.ts` na linha 150-166:

```typescript
private applyAttributesFromState() {
  const s = this.state();
  this.toggleAttribute('data-bs-theme', s.theme);

  // ... código ...

  (Object.entries(s) as [keyof LayoutState, any][]).forEach(([key, val]) => {
    if (typeof val === 'boolean') {
      const className = this.settingClassMap[key];
      if (className) this.html.classList.toggle(className, val);
    }
  });
}
```

**Solução:** Este método é chamado no `constructor()`, então deve funcionar automaticamente.

### Problema: localStorage está vazio ou com dados antigos

**Solução:**

1. Limpar localStorage:
```javascript
localStorage.removeItem('__SMART_ADMIN_ANGULAR_CONFIG__')
```

2. Recarregar página (F5)

3. Testar novamente

### Problema: Service não é encontrado

**Verificar imports:**

```bash
cd projeto
grep -r "layout-store.service" src/app --include="*.ts"
```

**Resultado esperado:**
```
src/app/core/services/layout/layout-store.service.ts:...
src/app/layouts/components/customizer/customizer.ts:import {LayoutService} from '@core/services/layout/layout-store.service';
... (outros imports)
```

Todos devem apontar para: `@core/services/layout/layout-store.service`

---

## 📋 Checklist de Validação

Após seguir os passos acima:

- [ ] Build concluído sem erros
- [ ] Aplicação recarregada com cache limpo
- [ ] App Builder abre corretamente
- [ ] Checkbox "Header position fixed" funciona
- [ ] Checkbox "Navigation full height" funciona
- [ ] Classes CSS são adicionadas ao `<html>`
- [ ] Estado é persistido no localStorage
- [ ] Após reload, estado é restaurado

---

## 🔄 Como Funciona (Explicação Técnica)

### 1. Inicialização

Quando a aplicação carrega:

```typescript
constructor(private offcanvas: NgbOffcanvas) {
  this.applyAttributesFromState();  // ← Aplica estado inicial
}
```

### 2. Carregamento do Estado

```typescript
private loadInitialState(): LayoutState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INIT_STATE;
  } catch {
    return INIT_STATE;
  }
}
```

### 3. Toggle de Setting

Quando você clica em um checkbox no App Builder:

```typescript
// customizer.ts
toggle(key: keyof LayoutState, e: Event) {
  const val = (e.target as HTMLInputElement).checked;
  this.layout.toggleSetting(key, val);  // ← Chama o service
}
```

```typescript
// layout-store.service.ts
toggleSetting(key: keyof LayoutState, value: boolean, persist = true) {
  const className = this.settingClassMap[key];  // Ex: 'set-header-fixed'
  if (className) {
    this.html.classList.toggle(className, value);  // ← Adiciona/remove classe
  }
  this.updateState({ [key]: value } as Partial<LayoutState>, persist);
}
```

### 4. Persistência

```typescript
private persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
  this._state$.next(this.state());
}
```

O estado é salvo no `localStorage` e na próxima vez que você abrir a aplicação, ele será restaurado automaticamente.

---

## 📊 Mapeamento de Funcionalidades

| Feature no App Builder | Key no State | Classe CSS Aplicada |
|------------------------|--------------|---------------------|
| Header position fixed | `headerFixed` | `set-header-fixed` |
| Navigation full height | `navFull` | `set-nav-full` |
| Navigation position fixed | `navFixed` | `set-nav-fixed` |
| Navigation collapsed | `navCollapsed` | `set-nav-collapsed` |
| Navigation Minified | `navMinified` | `set-nav-minified` |
| Dark Navigation | `darkNavigation` | `set-nav-dark` |
| Colorblind Mode | `colorblindMode` | `set-colorblind-mode` |
| High Contrast Mode | `highContrastMode` | `set-high-contrast-mode` |

---

## 🚀 Próximos Passos

Se o problema persistir após seguir todos os passos:

1. Verificar console do navegador para erros JavaScript
2. Verificar aba Network para ver se arquivos estão sendo carregados
3. Verificar se há conflitos com extensões do navegador
4. Testar em modo anônimo/privado do navegador
5. Testar em outro navegador

---

## 📝 Notas

- ✅ O build está funcionando corretamente (verificado)
- ✅ Os imports estão corretos (8 arquivos atualizados)
- ✅ A estrutura de pastas está correta
- ⚠️ **Requer rebuild + hard reload no navegador**

---

**Criado por:** Claude Code
**Data:** 27 de Outubro de 2025
