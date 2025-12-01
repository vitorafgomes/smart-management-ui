import { Injectable } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';

/**
 * Serviço helper para facilitar o uso do Grafana Faro na aplicação
 *
 * Este serviço fornece métodos convenientes para:
 * - Enviar logs customizados
 * - Rastrear eventos de negócio
 * - Adicionar metadados de sessão
 * - Criar traces manuais
 */
@Injectable({
  providedIn: 'root'
})
export class FaroService {

  /**
   * Verifica se o Faro está inicializado
   */
  get isInitialized(): boolean {
    return !!faro;
  }

  /**
   * Envia um log para o Grafana Faro
   *
   * @param message - Mensagem do log
   * @param level - Nível do log (trace, debug, info, warn, error)
   * @param context - Contexto adicional (objeto com metadados)
   *
   * @example
   * faroService.log('Usuário fez login', 'info', { userId: '123', email: 'user@example.com' });
   */
  log(message: string, level: 'trace' | 'debug' | 'info' | 'warn' | 'error' = 'info', context?: Record<string, any>): void {
    if (!this.isInitialized) return;

    faro.api.pushLog([message], {
      context: {
        ...context,
        level,
      },
    });
  }

  /**
   * Rastreia um evento de negócio customizado
   *
   * @param eventName - Nome do evento
   * @param attributes - Atributos do evento
   *
   * @example
   * faroService.trackEvent('purchase_completed', { orderId: '456', amount: 99.90 });
   */
  trackEvent(eventName: string, attributes?: Record<string, any>): void {
    if (!this.isInitialized) return;

    faro.api.pushEvent(eventName, attributes);
  }

  /**
   * Adiciona metadados à sessão do usuário
   * Estes metadados serão enviados com todos os eventos subsequentes
   *
   * @param key - Chave do metadado
   * @param value - Valor do metadado
   *
   * @example
   * faroService.setUser({ id: '123', email: 'user@example.com', role: 'admin' });
   */
  setUser(user: { id?: string; email?: string; username?: string; [key: string]: any }): void {
    if (!this.isInitialized) return;

    faro.api.setUser(user);
  }

  /**
   * Mede a performance de uma operação
   *
   * @param name - Nome da operação
   * @param operation - Função a ser executada e medida
   *
   * @example
   * await faroService.measurePerformance('load-user-data', async () => {
   *   return await this.http.get('/api/user').toPromise();
   * });
   */
  async measurePerformance<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      this.trackEvent('performance_measurement', {
        operationName: name,
        duration,
        status: 'success',
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.trackEvent('performance_measurement', {
        operationName: name,
        duration,
        status: 'error',
      });

      throw error;
    }
  }

  /**
   * Captura um erro manualmente
   *
   * @param error - Erro a ser capturado
   * @param context - Contexto adicional
   *
   * @example
   * faroService.captureError(new Error('Erro customizado'), { component: 'UserProfile' });
   */
  captureError(error: Error, context?: Record<string, any>): void {
    if (!this.isInitialized) return;

    faro.api.pushError(error);

    if (context) {
      this.log('Error captured with context', 'error', context);
    }
  }
}