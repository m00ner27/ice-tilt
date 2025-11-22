import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../store/services/api.service';
import { ImageUrlService } from '../../shared/services/image-url.service';

interface Article {
  _id?: string;
  title: string;
  slug: string;
  author: string;
  date: string;
  imageUrl?: string;
  lead?: string;
  body: string;
  published: boolean;
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css'
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  loading = false;
  error: string | null = null;
  
  isAddingArticle = false;
  editingArticle: Article | null = null;
  articleForm: FormGroup;
  
  imagePreview: string | ArrayBuffer | null = null;
  uploadingImage = false;

  constructor(
    private apiService: ApiService,
    private imageUrlService: ImageUrlService,
    private fb: FormBuilder
  ) {
    this.articleForm = this.fb.group({
      title: ['', Validators.required],
      slug: ['', Validators.required],
      author: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      imageUrl: [''],
      lead: [''],
      body: ['', Validators.required],
      published: [false]
    });
  }

  ngOnInit(): void {
    this.loadArticles();
    
    // Auto-generate slug from title
    this.articleForm.get('title')?.valueChanges.subscribe(title => {
      if (title && !this.editingArticle) {
        const slug = title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        this.articleForm.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  loadArticles(): void {
    this.loading = true;
    this.error = null;
    
    this.apiService.getAllArticlesForAdmin().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading articles:', err);
        this.error = 'Failed to load articles. Please try again later.';
        this.loading = false;
      }
    });
  }

  switchToCreateMode(): void {
    this.isAddingArticle = true;
    this.editingArticle = null;
    this.articleForm.reset({
      title: '',
      slug: '',
      author: '',
      date: new Date().toISOString().split('T')[0],
      imageUrl: '',
      lead: '',
      body: '',
      published: false
    });
    this.imagePreview = null;
  }

  switchToEditMode(article: Article): void {
    this.isAddingArticle = true;
    this.editingArticle = article;
    this.articleForm.patchValue({
      title: article.title,
      slug: article.slug,
      author: article.author,
      date: new Date(article.date).toISOString().split('T')[0],
      imageUrl: article.imageUrl || '',
      lead: article.lead || '',
      body: article.body,
      published: article.published
    });
    this.imagePreview = article.imageUrl ? this.imageUrlService.getImageUrl(article.imageUrl) : null;
  }

  cancelForm(): void {
    this.isAddingArticle = false;
    this.editingArticle = null;
    this.articleForm.reset();
    this.imagePreview = null;
  }

  onImageFileChange(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingImage = true;
      
      this.apiService.uploadFile(file).subscribe({
        next: (res) => {
          const imageUrl = res.url || res.data?.url || res;
          this.articleForm.patchValue({ imageUrl: imageUrl });
          this.imagePreview = this.imageUrlService.getImageUrl(imageUrl);
          this.uploadingImage = false;
        },
        error: (error) => {
          console.error('Upload failed:', error);
          alert('Image upload failed. Please try again.');
          this.uploadingImage = false;
        }
      });
      
      // Show local preview while uploading
      const reader = new FileReader();
      reader.onload = e => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveArticle(): void {
    if (this.articleForm.invalid) {
      alert('Please fill in all required fields.');
      return;
    }

    const formValue = this.articleForm.value;
    const articleData = {
      ...formValue,
      date: new Date(formValue.date)
    };

    if (this.editingArticle?._id) {
      // Update existing article
      this.apiService.updateArticle(this.editingArticle._id, articleData).subscribe({
        next: () => {
          this.loadArticles();
          this.cancelForm();
        },
        error: (err) => {
          console.error('Error updating article:', err);
          alert('Failed to update article. Please try again.');
        }
      });
    } else {
      // Create new article
      this.apiService.createArticle(articleData).subscribe({
        next: () => {
          this.loadArticles();
          this.cancelForm();
        },
        error: (err) => {
          console.error('Error creating article:', err);
          alert('Failed to create article. Please try again.');
        }
      });
    }
  }

  deleteArticle(article: Article): void {
    if (!article._id) return;
    
    if (confirm(`Are you sure you want to delete "${article.title}"? This action cannot be undone.`)) {
      this.apiService.deleteArticle(article._id).subscribe({
        next: () => {
          this.loadArticles();
        },
        error: (err) => {
          console.error('Error deleting article:', err);
          alert('Failed to delete article. Please try again.');
        }
      });
    }
  }

  getImageUrl(imageUrl?: string): string {
    return this.imageUrlService.getImageUrl(imageUrl);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

