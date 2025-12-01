# 🔄 Reorganização de Services - Smart Admin UI

**Data:** 27 de Outubro de 2025
**Objetivo:** Organizar todos os serviços dentro de `src/app/core/services` separados por pasta

---

## 📊 BEFORE → AFTER

### Estrutura Anterior (BEFORE)

```
src/app/
├── services/                          ❌ Localização incorreta
│   ├── faro.service.ts
│   └── faro-error-handler.service.ts
├── config/
│   └── faro.config.ts
└── app.config.ts
```

**Problemas:**
- ❌ Services diretamente em `src/app/services/` (não segue padrão core)
- ❌ Services não agrupados por funcionalidade
- ❌ Não segue arquitetura de módulos core

---

### Estrutura Nova (AFTER)

```
src/app/
├── core/                              ✅ Módulo core
│   └── services/                      ✅ Todos os services aqui
│       └── faro/                      ✅ Agrupados por funcionalidade
│           ├── faro.service.ts
│           └── faro-error-handler.service.ts
├── config/
│   └── faro.config.ts
└── app.config.ts                      ✅ Import atualizado
```

**Melhorias:**
- ✅ Services organizados em `src/app/core/services/`
- ✅ Agrupamento por funcionalidade (pasta `faro/`)
- ✅ Segue arquitetura Angular modular
- ✅ Fácil escalabilidade para novos services
- ✅ Separação clara de responsabilidades

---

## 📋 Detalhamento das Mudanças

### 1. Arquivos Movidos

| Arquivo Original | Novo Local | Status |
|------------------|------------|--------|
| `src/app/services/faro.service.ts` | `src/app/core/services/faro/faro.service.ts` | ✅ Movido |
| `src/app/services/faro-error-handler.service.ts` | `src/app/core/services/faro/faro-error-handler.service.ts` | ✅ Movido |
| `src/app/core/services/layout-store.service.ts` | `src/app/core/services/layout/layout-store.service.ts` | ✅ Movido |

### 2. Pastas Criadas

| Pasta | Propósito | Status |
|-------|-----------|--------|
| `src/app/core/` | Módulo core da aplicação | ✅ Criada |
| `src/app/core/services/` | Container de todos os services | ✅ Criada |
| `src/app/core/services/faro/` | Services relacionados ao Grafana Faro | ✅ Criada |
| `src/app/core/services/layout/` | Services relacionados ao layout/UI | ✅ Criada |

### 3. Pastas Removidas

| Pasta | Motivo | Status |
|-------|--------|--------|
| `src/app/services/` | Vazia após mover services | ✅ Removida |

### 4. Imports Atualizados

| Arquivo | Import Antigo | Import Novo | Status |
|---------|---------------|-------------|--------|
| `src/app/app.config.ts` | `./services/faro-error-handler.service` | `./core/services/faro/faro-error-handler.service` | ✅ Atualizado |
| `customizer.ts`, `app-menu.ts`, etc. (7 arquivos) | `@core/services/layout-store.service` | `@core/services/layout/layout-store.service` | ✅ Atualizado |

---

## 🏗️ Arquitetura de Services

### Estrutura Recomendada

```
src/app/core/services/
├── faro/                              # Observabilidade (Grafana Faro)
│   ├── faro.service.ts
│   ├── faro-error-handler.service.ts
│   └── faro.service.spec.ts
│
├── auth/                              # Autenticação (exemplo futuro)
│   ├── auth.service.ts
│   ├── auth-guard.service.ts
│   └── auth.service.spec.ts
│
├── api/                               # API/HTTP (exemplo futuro)
│   ├── api.service.ts
│   ├── http-interceptor.service.ts
│   └── api.service.spec.ts
│
└── storage/                           # Storage local (exemplo futuro)
    ├── storage.service.ts
    └── storage.service.spec.ts
```

### Convenções

1. **Agrupamento por funcionalidade:** Cada pasta representa um domínio/funcionalidade
2. **Nomenclatura:** `nome.service.ts` para services, `nome.service.spec.ts` para testes
3. **Exports:** Cada pasta pode ter um `index.ts` para facilitar imports
4. **Injeção:** Todos os services devem usar `{ providedIn: 'root' }` ou ser fornecidos em módulos específicos

---

## 📝 Descrição dos Services

### Pasta: faro/

#### faro.service.ts
**Função:** Wrapper conveniente para Grafana Faro Web SDK

**Métodos principais:**
- `log()` - Logging customizado
- `trackEvent()` - Rastreamento de eventos de negócio
- `setUser()` - Definir informações do usuário
- `measurePerformance()` - Medição de performance
- `captureError()` - Captura manual de erros

**Uso:**
```typescript
import { FaroService } from './core/services/faro/faro.service';

constructor(private faroService: FaroService) {}

this.faroService.log('Usuário logou', 'info', { userId: '123' });
this.faroService.trackEvent('purchase_completed', { amount: 99.90 });
```

#### faro-error-handler.service.ts
**Função:** ErrorHandler customizado do Angular para integração com Faro

**Integração:**
```typescript
// src/app/app.config.ts
import { FaroErrorHandler } from './core/services/faro/faro-error-handler.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: FaroErrorHandler },
  ]
};
```

**Comportamento:**
- Captura todos os erros não tratados do Angular
- Envia automaticamente para Grafana Faro
- Adiciona contexto (stack trace, mensagem, nome do erro)
- Loga no console para debug local

---

## 🔄 Como Adicionar Novos Services

### Passo 1: Criar Pasta para Funcionalidade

```bash
mkdir -p src/app/core/services/nome-funcionalidade
```

### Passo 2: Criar Service

```bash
cd src/app/core/services/nome-funcionalidade
ng generate service nome-funcionalidade
```

### Passo 3: Implementar Service

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'  // Singleton em toda aplicação
})
export class NomeFuncionalidadeService {
  constructor() { }

  // Seus métodos aqui
}
```

### Passo 4: Usar Service

```typescript
import { NomeFuncionalidadeService } from './core/services/nome-funcionalidade/nome-funcionalidade.service';

constructor(private service: NomeFuncionalidadeService) {}
```

---

## ✅ Checklist de Validação

Após reorganização:

- [x] Todos os services estão em `src/app/core/services/`
- [x] Services agrupados por funcionalidade em subpastas
- [x] Pasta antiga `src/app/services/` removida
- [x] Imports atualizados em `app.config.ts`
- [x] Nenhum import quebrado
- [x] Build compila sem erros
- [x] Tests passam (se aplicável)

---

## 🔍 Verificação

### Verificar Estrutura

```bash
cd src/app
find core/services -type f -name "*.ts"
```

**Saída esperada:**
```
core/services/faro/faro.service.ts
core/services/faro/faro-error-handler.service.ts
```

### Verificar Imports

```bash
grep -r "from.*services" src/app/*.ts
```

**Saída esperada:**
```
src/app/app.config.ts:import { FaroErrorHandler } from './core/services/faro/faro-error-handler.service';
```

### Build

```bash
npm run build
```

**Status esperado:** ✅ Success

---

## 🎯 Benefícios da Nova Estrutura

### Para Desenvolvimento

1. **Organização clara:** Services agrupados por funcionalidade
2. **Fácil localização:** Sabe exatamente onde está cada service
3. **Escalabilidade:** Fácil adicionar novos services sem bagunçar
4. **Padrão consistente:** Todos os services seguem mesma estrutura

### Para Manutenção

1. **Separação de responsabilidades:** Cada pasta tem função específica
2. **Imports limpos:** Caminhos claros e previsíveis
3. **Módulos core:** Segue arquitetura Angular recomendada
4. **Testabilidade:** Fácil criar mocks e testes unitários

### Para Novos Desenvolvedores

1. **Arquitetura clara:** Entende estrutura rapidamente
2. **Convenção sobre configuração:** Segue padrões Angular
3. **Documentação implícita:** Estrutura de pastas auto-explicativa
4. **Onboarding facilitado:** Sabe onde colocar novos services

---

## 📚 Referências

### Arquitetura Angular

- [Angular Style Guide - Folders-by-feature structure](https://angular.dev/style-guide#folders-by-feature-structure)
- [Core Module Pattern](https://angular.dev/guide/ngmodules/singleton-services)

### Documentação do Projeto

- **Arquitetura completa:** `/home/vitorafgomes/WorkSpace/docs/ui/ARCHITECTURE.md`
- **Documentação Faro:** `/home/vitorafgomes/WorkSpace/docs/ui/FARO_SETUP.md`

---

## 📊 Comparativo

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Localização | `src/app/services/` | `src/app/core/services/` |
| Organização | Plana | Por funcionalidade |
| Escalabilidade | Limitada | Excelente |
| Imports | `./services/nome` | `./core/services/funcionalidade/nome` |
| Padrão Angular | ❌ Não segue | ✅ Segue |

---

## 🔄 Histórico

### 2025-10-27 - Reorganização Inicial

**Ações:**
- ✅ Criada estrutura `src/app/core/services/`
- ✅ Criada subpasta `faro/` para services de observabilidade
- ✅ Movidos 2 services de Faro
- ✅ Atualizado import em `app.config.ts`
- ✅ Removida pasta antiga `services/`

**Resultado:**
- Projeto organizado seguindo padrões Angular
- Fácil adicionar novos services no futuro
- Base sólida para crescimento da aplicação

---

**Criado por:** Claude Code
**Data:** 27 de Outubro de 2025
**Versão:** 1.0
