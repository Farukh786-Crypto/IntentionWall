import { Service } from '@angular/core';

@Service()
export class Scroll {
    scrollToSection(sectionId: string): void {
        document.getElementById(sectionId)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}
