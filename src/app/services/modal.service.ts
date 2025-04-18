// modal.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private modalOpenSource = new BehaviorSubject<boolean>(false);
  modalOpen$ = this.modalOpenSource.asObservable();

  openModal() {
    this.modalOpenSource.next(true);
  }

  closeModal() {
    this.modalOpenSource.next(false);
  }
}
