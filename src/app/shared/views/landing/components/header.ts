import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink
  ],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top w-100 py-3">
      <div class="container">
        <a class="navbar-brand" routerLink="/dashboard/control-center">
          <img src="/assets/img/logo-light.svg" alt="logo">
        </a>

        <div class="ms-auto d-flex gap-2">
          <a href="/auth/login" class="btn btn-link text-white border-0 text-decoration-none">Login</a>
          <a href="/auth/register" class="btn btn-link text-white border-0 text-decoration-none">Register</a>
        </div>
      </div>
    </nav>
  `,
  styles: ``
})
export class Header {

}
