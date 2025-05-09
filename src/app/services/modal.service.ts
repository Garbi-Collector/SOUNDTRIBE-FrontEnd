// modal.service.ts (actualizado)
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum ModalType {
  Auth = 'auth',
  ChangePassword = 'changePassword',
  ChangeSlug = 'changeSlug',
  Notification='Notification',
  None = 'none',
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalTypeSource = new BehaviorSubject<ModalType>(ModalType.None);
  modalType$ = this.modalTypeSource.asObservable();

  openModal(type: ModalType) {
    this.modalTypeSource.next(type);
  }

  closeModal() {
    this.modalTypeSource.next(ModalType.None);
  }
}
