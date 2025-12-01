import { Component } from '@angular/core';
import {Header} from '@/app/shared/views/landing/components/header';
import {Hero} from '@/app/shared/views/landing/components/hero';
import {Features} from '@/app/shared/views/landing/components/features';
import {Demo} from '@/app/shared/views/landing/components/demo';
import {Journey} from '@/app/shared/views/landing/components/journey';
import {Testimonial} from '@/app/shared/views/landing/components/testimonial';
import {Newsletter} from '@/app/shared/views/landing/components/newsletter';
import {Faqs} from '@/app/shared/views/landing/components/faqs';
import {Contact} from '@/app/shared/views/landing/components/contact';
import {Footer} from '@/app/shared/views/landing/components/footer';

@Component({
  selector: 'app-landing',
  imports: [
    Header,
    Hero,
    Features,
    Demo,
    Journey,
    Testimonial,
    Newsletter,
    Faqs,
    Contact,
    Footer,
  ],
  templateUrl: './landing.html',
  styles: ``
})
export class Landing {

}
