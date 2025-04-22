import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeSlugComponent } from './change-slug.component';

describe('ChangeSlugComponent', () => {
  let component: ChangeSlugComponent;
  let fixture: ComponentFixture<ChangeSlugComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChangeSlugComponent]
    });
    fixture = TestBed.createComponent(ChangeSlugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
