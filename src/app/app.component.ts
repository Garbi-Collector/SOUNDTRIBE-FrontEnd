import {Component, OnInit} from '@angular/core';
import {ThemeService} from "./services/theme.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'SOUNDTRIBE-FrontEnd';
  constructor(private themeService: ThemeService) {}
  ngOnInit(): void {
    // El servicio ya se encarga de aplicar el tema inicial
  }
}
