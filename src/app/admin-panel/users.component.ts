import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../services/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error: string | null = null;
  editingUser: User | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
      },
      error: err => {
        this.error = 'Failed to load users.';
        this.loading = false;
      }
    });
  }

  editUser(user: User) {
    // Deep clone to avoid mutating the list until save
    this.editingUser = JSON.parse(JSON.stringify(user));
  }

  saveUser() {
    if (!this.editingUser) return;
    const id = this.editingUser.id || this.editingUser._id || '';
    this.userService.updateUser(id, this.editingUser).subscribe({
      next: updated => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.users[idx] = updated;
        this.editingUser = null;
      },
      error: err => {
        this.error = 'Failed to save user.';
      }
    });
  }

  cancelEdit() {
    this.editingUser = null;
  }
} 