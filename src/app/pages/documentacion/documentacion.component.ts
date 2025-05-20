import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-documentacion',
  templateUrl: './documentacion.component.html',
  styleUrls: ['./documentacion.component.css']
})
export class DocumentacionComponent implements OnInit {
  // Sección activa actual
  activeSection: string = 'general';


  copied = false;
  private email = 'soundtribe.art@gmail.com';

  // Control de FAQs abiertas
  openFaqs: number[] = [];

  // Modelo para el formulario de contacto
  contactForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // Detectar la sección de la URL
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        this.activeSection = params['section'];
      } else {
        // Por defecto, mostrar la sección general
        this.activeSection = 'general';
      }
    });
  }

  // Establecer la sección activa
  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  // Alternar la visibilidad de las preguntas en la sección FAQ
  toggleFaq(faqId: number): void {
    const index = this.openFaqs.indexOf(faqId);
    if (index === -1) {
      this.openFaqs.push(faqId);
    } else {
      this.openFaqs.splice(index, 1);
    }
  }
  copyEmail(): void {
    const email = 'soundtribe.art@gmail.com';
    const textarea = document.createElement('textarea');
    textarea.value = email;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      this.copied = successful;
    } catch (err) {
      alert('No se pudo copiar el correo, por favor cópielo manualmente.');
    }

    document.body.removeChild(textarea);

    if (this.copied) {
      setTimeout(() => this.copied = false, 3000);
    }
  }

}
