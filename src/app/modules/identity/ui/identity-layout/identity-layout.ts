import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-identity-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './identity-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityLayout {}
