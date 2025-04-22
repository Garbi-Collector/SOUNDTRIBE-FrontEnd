// app.component.ts
import { Component, OnInit } from '@angular/core';
import { ModalService, ModalType } from "./services/modal.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'SOUNDTRIBE-FrontEnd';

  modalType = ModalType.None;
  ModalType = ModalType;

  constructor(private modalService: ModalService) {
    this.modalService.modalType$.subscribe(type => {
      this.modalType = type;
    });
  }

  ngOnInit() {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  }
}
