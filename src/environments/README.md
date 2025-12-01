# Environment Configuration

Este diretório contém as configurações de ambiente para a aplicação Smart Management UI.

## Arquivos

- `environment.ts` - Configurações para ambiente de **desenvolvimento**
- `environment.prod.ts` - Configurações para ambiente de **produção**
- `environment.interface.ts` - Interface TypeScript para type safety

## Configurações Disponíveis

### API Configuration
```typescript
apiUrl: string
```
URL base da API Identity Tenant. Durante o build de produção, substitua por HTTPS.

### Keycloak Configuration
```typescript
keycloak: {
  url: string;        // URL do servidor Keycloak
  realm: string;      // Nome do realm
  clientId: string;   // ID do client
}
```

### Feature Flags
```typescript
features: {
  enableAuditLogs: boolean;              // Habilita logs de auditoria
  enableMultiTenant: boolean;            // Habilita suporte multi-tenant
  enableAdvancedFilters: boolean;        // Habilita filtros avançados
  enableRealTimeNotifications: boolean;  // Habilita notificações em tempo real
}
```

### Application Settings
```typescript
app: {
  name: string;                  // Nome da aplicação
  version: string;               // Versão da aplicação
  defaultLanguage: string;       // Idioma padrão (ISO 639-1)
  supportedLanguages: string[];  // Idiomas suportados
  defaultCurrency: string;       // Moeda padrão (ISO 4217)
  defaultTimezone: string;       // Timezone padrão (IANA)
}
```

### Pagination Settings
```typescript
pagination: {
  defaultPageSize: number;    // Tamanho padrão da página
  pageSizeOptions: number[];  // Opções de tamanho de página
}
```

### Cache Settings
```typescript
cache: {
  ttl: number;      // Time to live em milissegundos
  maxSize: number;  // Tamanho máximo do cache
}
```

### Session Settings
```typescript
session: {
  timeout: number;      // Timeout da sessão em milissegundos
  warningTime: number;  // Tempo de aviso antes do timeout
}
```

### Logging
```typescript
logging: {
  level: 'debug' | 'info' | 'warn' | 'error';  // Nível de log
  enableConsole: boolean;                       // Habilita console.log
  enableRemote: boolean;                        // Habilita log remoto
}
```

### External Services
```typescript
external: {
  faroUrl: string;           // URL do Grafana Faro
  analyticsEnabled: boolean; // Habilita analytics
}
```

## Como Usar

### Importar configurações
```typescript
import { environment } from '@env/environment';

// Usar configurações
const apiUrl = environment.apiUrl;
const isProduction = environment.production;
```

### Criar alias no tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@env/*": ["src/environments/*"]
    }
  }
}
```

## Build de Produção

Durante o build de produção, o Angular automaticamente substitui `environment.ts` por `environment.prod.ts`:

```bash
# Build de desenvolvimento
ng build

# Build de produção
ng build --configuration production
```

## Configuração no angular.json

Certifique-se de que o `angular.json` contém a configuração de file replacements:

```json
{
  "configurations": {
    "production": {
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.prod.ts"
        }
      ]
    }
  }
}
```

## Boas Práticas

1. **Nunca commitar credenciais** - Use variáveis de ambiente do sistema operacional para dados sensíveis
2. **Use HTTPS em produção** - Sempre use URLs seguras em ambiente de produção
3. **Mantenha consistência** - Garanta que os dois arquivos tenham a mesma estrutura
4. **Documente mudanças** - Mantenha este README atualizado ao adicionar novas configurações
5. **Type Safety** - Sempre use a interface `Environment` para garantir type safety

## Variáveis de Ambiente do Sistema

Para usar variáveis de ambiente do sistema, você pode criar um arquivo `environment.local.ts` (não commitado):

```typescript
export const environment = {
  ...
  apiUrl: process.env['API_URL'] || 'http://localhost:3000',
  ...
};
```

**Importante:** Adicione `environment.local.ts` ao `.gitignore`.
