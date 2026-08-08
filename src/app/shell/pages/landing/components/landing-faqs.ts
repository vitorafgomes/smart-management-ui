import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Faq {
  readonly question: string;
  readonly answer: string;
}

/**
 * The theme's accordion is Bootstrap markup driven by Bootstrap's JavaScript. The classes are
 * kept and the behaviour is a signal: one open question at a time, toggled by `.show`.
 */
@Component({
  selector: 'app-landing-faqs',
  templateUrl: './landing-faqs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFaqs {
  private readonly openQuestion = signal<string | null>(null);

  protected readonly faqs: readonly Faq[] = [
    {
      question: 'What is Smart Management?',
      answer:
        'A single back office for the areas a business actually runs on: identity and access, sales, purchasing, inventory, logistics and finance, each a bounded context inside one application.',
    },
    {
      question: 'Does it replace the systems we already have?',
      answer:
        'Area by area, rather than all at once. Each module lands on its own, and the ones still outside keep working until their turn comes.',
    },
    {
      question: 'Who can see what?',
      answer:
        'Access is granted through roles, and a role is a set of permissions rather than a job title, so a change to one person does not become a change to everyone like them.',
    },
    {
      question: 'Can we try it first?',
      answer:
        'Create an account and the whole console opens on sample data. Nothing you do there touches a real record.',
    },
  ];

  protected isOpen(question: string): boolean {
    return this.openQuestion() === question;
  }

  protected toggle(question: string): void {
    this.openQuestion.update((open) => (open === question ? null : question));
  }
}
