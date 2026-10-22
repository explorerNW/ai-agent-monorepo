import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HomeModule } from './home-module';

@Component({
  imports: [HomeModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
