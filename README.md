# Smart Admin UI

Template administrativo Angular com integração completa de observabilidade via Grafana Faro.

**Versão Angular:** 20.3.7 | **TypeScript:** 5.9.3 | **Faro SDK:** 1.19.0

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## 📚 Documentação do Projeto

A documentação completa do projeto está localizada em:

**`/home/vitorafgomes/WorkSpace/docs/ui/`**

### 📖 Documentação Disponível

- **README.md** - Índice completo da documentação
- **ARCHITECTURE.md** - Arquitetura do sistema (frontend, backend, infraestrutura)
- **KUBERNETES-SETUP.md** - Setup completo do cluster K3s
- **FARO_SETUP.md** - Configuração do Grafana Faro Web SDK
- **DEBUG-FARO.md** - Troubleshooting e debug
- **kubernetes/** - Documentação específica de Kubernetes
  - DEPLOY-QUICKSTART.md - Deploy rápido
  - README.md - Recursos Kubernetes
  - SETUP-VITORAFGOMES.md - Setup específico do ambiente

### 📂 Mapeamento de Mudanças

Ver **[FOLDER-MAPPING.md](FOLDER-MAPPING.md)** para detalhes da reorganização da documentação.

---

## 🚀 Quick Start

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm start
# ou
ng serve
```

Acesse: http://localhost:4200

### Build de Produção

```bash
npm run build
```

### Deploy no Kubernetes

```bash
kubectl apply -f k8s/otel-collector-fixed.yaml
```

---

## 🛠️ Stack Tecnológica

- **Frontend**: Angular 20.3.7, TypeScript 5.9.3, Bootstrap 5.3.7
- **Observabilidade**: Grafana Faro Web SDK 1.19.0, OpenTelemetry
- **Infraestrutura**: K3s, Traefik, Cloudflare
- **Telemetria**: Grafana Loki (logs), Grafana Tempo (traces)

---

**Para documentação completa, acesse: [docs/README.md](docs/README.md)**
