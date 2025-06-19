import { NgModule } from '@angular/core';
import { CreateUserComponent } from './create-user.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    CreateUserComponent,
  ],
  imports: [
    ReactiveFormsModule,
    HttpClientModule,
  ],
})
export class AdminPanelModule { } 