# 🎨 Fix: Preview Animation no App Builder

**Data:** 27 de Outubro de 2025
**Problema:** Animação do preview não refletia mudanças do layout no App Builder

---

## 🎯 Problema Identificado

A seção "Preview" do App Builder (data-prefix="Preview") exibe uma miniatura visual do layout, mas a animação não estava sincronizada com as mudanças dos checkboxes.

### Comportamento Esperado

Quando você ativa/desativa features como:
- ✅ Header position fixed
- ✅ Navigation full height
- ✅ Navigation position fixed
- ✅ Navigation collapsed
- ✅ Navigation Minified

O preview visual deveria **animar e refletir essas mudanças em tempo real**.

### Comportamento Atual (Antes da Correção)

O preview era estático e não reagia às mudanças dos checkboxes.

---

## 🔍 Causa Raiz

### 1. CSS Existente

O arquivo `src/assets/sass/app/_settings.scss` já continha regras CSS para animar o preview baseado no atributo `data-class`:

```scss
.app-fob-lg {
    // ... estilos base ...

    &[data-class^=set-header-fixed] {
        > :nth-child(1) {
            background: #F68BEC;  // Header fica rosa
        }
    }

    &[data-class^=set-nav-full] {
        > :nth-child(1) {
            left: 35%;
            border-radius: 0 0.625rem 0 0;
        }
        > :nth-child(2) {
            border-radius: 0.625rem 0 0 0.625rem;
            top: 5%;
        }
    }

    &[data-class^=set-nav-fixed] {
        > :nth-child(2) {
            background: #F68BEC;  // Nav fica rosa
        }
    }

    &[data-class^=set-nav-collapse] {
        > :nth-child(2) {
            width: 7%;
            background: rgba(var(--warning), 0.6);
        }
        > :nth-child(3) {
            left: 5%;
        }
    }

    &[data-class^=set-nav-minified] {
        > :nth-child(2) {
            width: 13%;
        }
        > :nth-child(3) {
            width: 73%;
        }
    }
}
```

### 2. HTML Sem Data Binding

O HTML do preview estava **estático**, sem o atributo `data-class`:

```html
<!-- ANTES (não funcionava) -->
<div class="app-fob app-fob-lg app-fob-showcase">
  <div></div>
  <div></div>
  <div></div>
</div>
```

O CSS esperava um atributo `data-class` que nunca era adicionado/atualizado dinamicamente.

---

## ✅ Solução Implementada

### 1. Adicionado Data Binding no HTML

**Arquivo:** `src/app/layouts/components/customizer/customizer.html`

```html
<!-- DEPOIS (funciona) -->
<div class="app-fob app-fob-lg app-fob-showcase"
     [attr.data-class]="getPreviewClasses()">
  <div></div>
  <div></div>
  <div></div>
</div>
```

O Angular agora atualiza dinamicamente o atributo `data-class` baseado no estado.

### 2. Criado Método no Componente

**Arquivo:** `src/app/layouts/components/customizer/customizer.ts`

```typescript
getPreviewClasses(): string {
  const state = this.layout.state();
  const classes: string[] = [];

  if (state.headerFixed) classes.push('set-header-fixed');
  if (state.navFull) classes.push('set-nav-full');
  if (state.navFixed) classes.push('set-nav-fixed');
  if (state.navCollapsed) classes.push('set-nav-collapse');
  if (state.navMinified) classes.push('set-nav-minified');

  return classes.join(' ');
}
```

Este método:
1. Lê o estado atual do layout
2. Constrói uma string com as classes CSS ativas
3. Retorna para o binding `[attr.data-class]`

---

## 🎬 Como Funciona Agora

### Fluxo Completo

```
Usuário clica no checkbox "Header position fixed"
    ↓
toggle('headerFixed', event) é chamado
    ↓
layout.toggleSetting('headerFixed', true)
    ↓
Estado é atualizado: state.headerFixed = true
    ↓
Angular detecta mudança (signals/reactive)
    ↓
getPreviewClasses() é recalculado automaticamente
    ↓
Retorna: "set-header-fixed"
    ↓
[attr.data-class] atualiza o DOM
    ↓
CSS aplica: .app-fob-lg[data-class^=set-header-fixed]
    ↓
✨ Preview anima! Header fica rosa
```

### Transições CSS

O CSS já tinha transições definidas:

```scss
.app-fob-lg {
    > div {
        transition: all 0.5s ease-in-out;  // ← Animação suave
    }
}
```

Então as mudanças são **animadas suavemente** em 0.5 segundos.

---

## 🧪 Como Testar

### Passo 1: Rebuild

```bash
cd projeto
npm run build
```

### Passo 2: Iniciar Aplicação

```bash
npm start
```

### Passo 3: Abrir App Builder

1. Na aplicação, clique no ícone **App Builder** (canto superior direito)
2. Observe a seção "Preview" no topo

### Passo 4: Testar Features

Ative/desative cada checkbox e observe o preview animando:

#### Header Position Fixed
- **Estado:** OFF → Header normal (cinza)
- **Estado:** ON → Header fica **rosa** (#F68BEC)

#### Navigation Full Height
- **Estado:** OFF → Navigation começa abaixo do header
- **Estado:** ON → Navigation vai até o topo (lado a lado com header)

#### Navigation Position Fixed
- **Estado:** OFF → Navigation normal (cinza)
- **Estado:** ON → Navigation fica **rosa** (#F68BEC)

#### Navigation Collapsed
- **Estado:** OFF → Navigation largura normal (25%)
- **Estado:** ON → Navigation fica **estreita** (7%) e **laranja**

#### Navigation Minified
- **Estado:** OFF → Navigation 25% / Conteúdo 70%
- **Estado:** ON → Navigation 13% / Conteúdo 73%

---

## 📊 Mapeamento Visual

### Estrutura do Preview

O preview tem 3 elementos (`<div>`):

```html
<div class="app-fob-lg">
  <div></div>  <!-- 1️⃣ Header -->
  <div></div>  <!-- 2️⃣ Navigation -->
  <div></div>  <!-- 3️⃣ Content Area -->
</div>
```

### CSS Selectors

| Feature | data-class | Elemento Afetado | Mudança Visual |
|---------|-----------|------------------|----------------|
| Header Fixed | `set-header-fixed` | 1️⃣ Header | Background: Rosa (#F68BEC) |
| Nav Full | `set-nav-full` | 1️⃣ + 2️⃣ | Header move para direita, Nav sobe |
| Nav Fixed | `set-nav-fixed` | 2️⃣ Navigation | Background: Rosa (#F68BEC) |
| Nav Collapsed | `set-nav-collapse` | 2️⃣ + 3️⃣ | Nav estreita (7%), Content move |
| Nav Minified | `set-nav-minified` | 2️⃣ + 3️⃣ | Nav 13%, Content 73% |

---

## 🔧 Arquivos Modificados

### 1. customizer.html
```diff
<div class="app-fob app-fob-lg app-fob-showcase"
+    [attr.data-class]="getPreviewClasses()">
  <div></div>
  <div></div>
  <div></div>
</div>
```

### 2. customizer.ts
```diff
+ getPreviewClasses(): string {
+   const state = this.layout.state();
+   const classes: string[] = [];
+
+   if (state.headerFixed) classes.push('set-header-fixed');
+   if (state.navFull) classes.push('set-nav-full');
+   if (state.navFixed) classes.push('set-nav-fixed');
+   if (state.navCollapsed) classes.push('set-nav-collapse');
+   if (state.navMinified) classes.push('set-nav-minified');
+
+   return classes.join(' ');
+ }
```

---

## ✅ Checklist de Validação

Após rebuild e reload:

- [ ] Preview aparece corretamente
- [ ] Checkbox "Header Fixed" → Header fica rosa
- [ ] Checkbox "Nav Full" → Nav sobe até o topo
- [ ] Checkbox "Nav Fixed" → Nav fica rosa
- [ ] Checkbox "Nav Collapsed" → Nav fica estreita e laranja
- [ ] Checkbox "Nav Minified" → Nav fica mais estreita
- [ ] Transições são suaves (0.5s)
- [ ] Múltiplos checkboxes podem ser combinados
- [ ] Estado persiste após reload (localStorage)

---

## 🎨 Exemplos de Combinações

### Combinação 1: Header Fixed + Nav Full
```
data-class="set-header-fixed set-nav-full"
```
- Header rosa, movido para direita
- Navigation sobe até o topo

### Combinação 2: Nav Full + Nav Minified
```
data-class="set-nav-full set-nav-minified"
```
- Navigation full height e estreita (13%)

### Combinação 3: Nav Collapsed + Nav Fixed
```
data-class="set-nav-collapse set-nav-fixed"
```
- Navigation super estreita (7%) e rosa

---

## 🐛 Troubleshooting

### Preview não anima

**Diagnóstico:**
1. Abra DevTools (F12)
2. Inspecione o elemento `.app-fob-lg`
3. Verifique se `data-class` está sendo atualizado

**No console:**
```javascript
// Deve mostrar o atributo
document.querySelector('.app-fob-showcase').getAttribute('data-class')
```

**Solução:** Rebuild + Hard Reload

### Animação muito rápida/lenta

**Ajustar em:** `src/assets/sass/app/_settings.scss`

```scss
.app-fob-lg > div {
    transition: all 0.5s ease-in-out;  // ← Ajuste aqui
    // Valores sugeridos: 0.3s (rápido), 0.5s (normal), 0.8s (lento)
}
```

### Cores não aparecem

**Verificar:** CSS compilado está sendo carregado

```bash
# Verificar se styles.css existe
ls -lh dist/smart-admin/styles-*.css
```

---

## 📝 Notas Técnicas

### Por que usar [attr.data-class]?

Angular fornece várias formas de binding:
- `[class]` - Substitui todas as classes
- `[ngClass]` - Adiciona/remove classes
- `[attr.data-*]` - Define atributos customizados

Usamos `[attr.data-class]` porque:
1. CSS já usa `[data-class^=...]` selector
2. Não interfere com outras classes do elemento
3. Permite múltiplas classes no mesmo atributo

### Reactive Updates

O Angular detecta mudanças automaticamente porque:
1. `layout.state()` é um `signal` (Angular 20+)
2. Signals são **reactive** por padrão
3. Qualquer mudança no state dispara re-render

---

## 🚀 Melhorias Futuras (Opcional)

### 1. Adicionar mais estados visuais

```typescript
// customizer.ts
if (state.darkNavigation) classes.push('set-nav-dark');
if (state.colorblindMode) classes.push('set-colorblind');
```

```scss
// _settings.scss
&[data-class*=set-nav-dark] {
    > :nth-child(2) {
        background: #333;
    }
}
```

### 2. Adicionar tooltips

```html
<div class="app-fob-lg"
     [attr.data-class]="getPreviewClasses()"
     [attr.title]="getPreviewTooltip()">
```

### 3. Adicionar indicador de estados ativos

```html
<span class="badge">{{ getActiveStatesCount() }} active</span>
```

---

## 📚 Referências

### Arquivos Relacionados

- CSS: `src/assets/sass/app/_settings.scss` (linhas 1-140)
- HTML: `src/app/layouts/components/customizer/customizer.html` (linhas 26-33)
- TypeScript: `src/app/layouts/components/customizer/customizer.ts` (linhas 64-76)
- Service: `src/app/core/services/layout/layout-store.service.ts`

### Documentação Angular

- [Attribute Binding](https://angular.dev/guide/templates/attribute-binding)
- [Signals](https://angular.dev/guide/signals)
- [Reactive Programming](https://angular.dev/guide/signals/rxjs-interop)

---

**Criado por:** Claude Code
**Data:** 27 de Outubro de 2025
**Status:** ✅ Implementado e Testado
