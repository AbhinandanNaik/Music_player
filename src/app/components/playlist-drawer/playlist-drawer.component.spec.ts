import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistDrawerComponent } from './playlist-drawer.component';

describe('PlaylistDrawerComponent', () => {
  let component: PlaylistDrawerComponent;
  let fixture: ComponentFixture<PlaylistDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistDrawerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlaylistDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
