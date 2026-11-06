import type { ProjectRepository } from '../domain/project-repository'
import type { ProjectWrite } from '../domain/project'

export function createProjectUseCases(repository: ProjectRepository) {
  return {
    list: (params: URLSearchParams) => repository.list(params),
    get: (id: string) => repository.get(id),
    createDraft: (project: ProjectWrite) => repository.createDraft(project),
    async saveDraft(id: string | null, project: ProjectWrite) {
      if (!project.content.title.en.trim() && !project.content.title.ar.trim()) {
        throw new Error('Add a project title in at least one language.')
      }
      if (!project.content.slug.trim()) throw new Error('Add a URL slug before saving.')
      const saved = id
        ? await repository.saveDraft(id, project)
        : await repository.createDraft(project)
      return saved.data._id
    },
    publish: (id: string) => repository.publish(id),
    setStatus: (id: string, status: 'draft' | 'published' | 'archived') => repository.setStatus(id, status),
    delete: (id: string) => repository.delete(id),
    preview: (id: string) => repository.preview(id),
  }
}
