import {Component, OnInit} from '@angular/core';
import {ModalService} from "./services/modal.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'SOUNDTRIBE-FrontEnd';

  modalOpen = false;

  constructor(private modalService: ModalService) {
    this.modalService.modalOpen$.subscribe(isOpen => {
      this.modalOpen = isOpen;
    });
  }
  ngOnInit() {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  }

}
