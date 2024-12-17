import { Component , Injectable} from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
@Injectable({providedIn: 'root'})
export class NavigationComponent {
  constructor(private http: HttpClient) {
    console.log('HttpClient initialized!');
  }
}

