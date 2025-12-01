import {Routes} from '@angular/router';
import {Login} from './login/login';
import {Register} from './register/register';
import {LockScreen} from './lock-screen/lock-screen';
import {TwoFactor} from './two-factor/two-factor';
import {ForgotPassword} from './forgot-password/forgot-password';
import {publicGuard} from '@core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'auth/login',
    component: Login,
    canActivate: [publicGuard],
    data: {title: "Login"},
  },
  {
    path: 'auth/register',
    component: Register,
    canActivate: [publicGuard],
    data: {title: "Register"},
  },
  {
    path: 'auth/lockscreen',
    component: LockScreen,
    data: {title: "Lockscreen"},
  },
  {
    path: 'auth/two-factor',
    component: TwoFactor,
    data: {title: "Two Factor"},
  },
  {
    path: 'auth/forgot-password',
    component: ForgotPassword,
    data: {title: "Forgot Password"},
  },

];
