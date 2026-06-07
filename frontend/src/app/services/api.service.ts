import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AvailableComponent, LearningPath } from '../models/learning-path.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiURL;

  constructor(private http: HttpClient) {}

  getComponents(): Observable<{ items: AvailableComponent[]; totalCount: number }> {
    return this.http.get<{ items: AvailableComponent[]; totalCount: number }>(
      `${this.baseUrl}/components`
    );
  }

  getLearningPaths(): Observable<LearningPath[]> {
    return this.http.get<LearningPath[]>(`${this.baseUrl}/learning-paths`);
  }

  getLearningPathById(id: string): Observable<LearningPath> {
    return this.http.get<LearningPath>(`${this.baseUrl}/learning-paths/${id}`);
  }

  saveLearningPath(path: LearningPath): Observable<LearningPath> {
    return this.http.post<LearningPath>(`${this.baseUrl}/learning-paths`, path);
  }
}
