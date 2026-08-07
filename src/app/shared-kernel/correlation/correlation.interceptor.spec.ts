import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  CORRELATION_ID_HEADER,
  SESSION_ID_HEADER,
  correlationInterceptor,
} from './correlation.interceptor';

describe('correlationInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
  });

  it('stamps every outgoing request with both identity headers', () => {
    http.get('/api/users').subscribe();

    const request = backend.expectOne('/api/users');

    expect(request.request.headers.get(SESSION_ID_HEADER)).toBeTruthy();
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBeTruthy();

    request.flush({});
  });

  it('keeps the session id stable and issues a fresh correlation id per request', () => {
    http.get('/api/first').subscribe();
    const first = backend.expectOne('/api/first');
    first.flush({});

    http.get('/api/second').subscribe();
    const second = backend.expectOne('/api/second');
    second.flush({});

    expect(first.request.headers.get(SESSION_ID_HEADER)).toBe(
      second.request.headers.get(SESSION_ID_HEADER),
    );
    expect(first.request.headers.get(CORRELATION_ID_HEADER)).not.toBe(
      second.request.headers.get(CORRELATION_ID_HEADER),
    );
  });

  it('stamps the headers on non-GET requests as well', () => {
    http.post('/api/users', { name: 'a' }).subscribe();

    const request = backend.expectOne('/api/users');

    expect(request.request.headers.get(SESSION_ID_HEADER)).toBeTruthy();
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBeTruthy();

    request.flush({});
  });
});
