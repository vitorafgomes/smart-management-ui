import { initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

/**
 * Configuração do Grafana Faro Web SDK
 *
 * O Faro fornece observabilidade completa para aplicações web:
 * - Logs
 * - Traces (rastreamento distribuído)
 * - Métricas de performance (Web Vitals)
 * - Captura de erros
 * - Session tracking
 */
export function initializeFaroMonitoring() {
  // Configuração hardcoded para vitorafgomes.net
  // TODO: Mover para environment.ts em produção
  const faroUrl = 'https://faro.vitorafgomes.net/v1/traces';
  const faroAppName = 'smart-admin';
  const faroEnvironment = 'production';

  console.log('🚀 Inicializando Grafana Faro...');
  console.log('   URL:', faroUrl);
  console.log('   App:', faroAppName);
  console.log('   Environment:', faroEnvironment);

  // Se a URL do Faro não estiver configurada, não inicializa
  if (!faroUrl) {
    console.warn('❌ Grafana Faro: URL não configurada. Monitoramento desabilitado.');
    return null;
  }

  try {
    const faro = initializeFaro({
      // URL do coletor Faro (Grafana Agent ou Grafana Cloud)
      url: faroUrl,

      // Nome da aplicação
      app: {
        name: faroAppName,
        version: '1.0.0', // Pode vir do package.json
        environment: faroEnvironment,
      },

      // Instrumentações adicionais
      instrumentations: [
        // Adiciona rastreamento de requisições HTTP e performance
        new TracingInstrumentation({
          // Instrumenta fetch API
          instrumentationOptions: {
            // Propaga contexto de trace para backends
            propagateTraceHeaderCorsUrls: [
              // Adicione aqui as URLs das suas APIs
              // Exemplo: /https?:\/\/api\.exemplo\.com\/.*/,
            ],
          },
        }),
      ],

      // Configurações de sessão
      sessionTracking: {
        enabled: true,
        persistent: true,
      },

      // Captura erros não tratados
      beforeSend: (event) => {
        // Você pode filtrar ou modificar eventos antes de enviá-los
        // Por exemplo, remover informações sensíveis
        return event;
      },

      // Coleta métricas de Web Vitals (LCP, FID, CLS, etc)
      metas: [
        // Adicione metadados customizados aqui
        // Exemplo: { userId: '123', userRole: 'admin' }
      ],
    });

    console.log('✅ Grafana Faro inicializado com sucesso!');
    console.log('   Faro instance:', faro);
    return faro;
  } catch (error) {
    console.error('❌ Erro ao inicializar Grafana Faro:', error);
    return null;
  }
}