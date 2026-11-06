import type { ProjectRecord, ProjectWrite } from './project'

export interface ProjectRepository {
  list(params: URLSearchParams): Promise<{
    data: Array<Pick<ProjectRecord, '_id' | 'content' | 'status' | 'featured'> & { updatedAt: string }>
    pagination: { pages: number; total: number }
  }>
  get(id: string): Promise<{ data: ProjectRecord }>
  createDraft(project: ProjectWrite): Promise<{ data: ProjectRecord }>
  saveDraft(id: string, project: ProjectWrite): Promise<{ data: ProjectRecord }>
  publish(id: string): Promise<{ data: ProjectRecord }>
  setStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<{ data: ProjectRecord }>
  delete(id: string): Promise<void>
  preview(id: string): Promise<{ data: ProjectRecord }>
}
