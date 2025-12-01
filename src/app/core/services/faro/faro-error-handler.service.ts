import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';

/**
 * Error Handler customizado que integra erros do Angular com o Grafana Faro
 *
 * Este handler captura todos os erros não tratados da aplicação Angular
 * e os envia para o Grafana Faro para monitoramento centralizado.
 */
@Injectable()
export class FaroErrorHandler implements ErrorHandler {
  private readonly ngZone = inject(NgZone);

  handleError(error: Error): void {
    // Log do erro no console (comportamento padrão)
    console.error('Erro capturado pelo FaroErrorHandler:', error);

    // Envia o erro para o Grafana Faro fora da zona do Angular
    // para evitar NG0100 (ExpressionChangedAfterItHasBeenCheckedError)
    this.ngZone.runOutsideAngular(() => {
      if (faro) {
        faro.api.pushError(error);

        faro.api.pushLog(['Angular Error'], {
          context: {
            message: error.message,
            stack: error.stack || '',
            name: error.name,
          },
        });
      }
    });
  }
}