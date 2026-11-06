import { apiRequest } from '../../../shared/infrastructure/api-client'
import type { ProjectRepository } from '../domain/project-repository'
import type { ProjectWrite } from '../domain/project'

export const httpProjectRepository: ProjectRepository = {
  list: (params) => apiRequest(`/admin/projects?${params}`),
  get: (id) => apiRequest(`/admin/projects/${id}`),
  createDraft: (project) => apiRequest('/admin/projects', { method: 'POST', body: JSON.stringify(project) }),
  saveDraft: (id, project) => apiRequest(`/admin/projects/${id}/draft`, { method: 'PUT', body: JSON.stringify(project) }),
  publish: (id) => apiRequest(`/admin/projects/${id}/publish`, { method: 'POST', body: '{}' }),
  setStatus: (id, status) => apiRequest(`/admin/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id) => apiRequest(`/admin/projects/${id}`, { method: 'DELETE' }),
  preview: (id) => apiRequest(`/admin/projects/${id}/preview`),
}

export type { ProjectWrite }
