import { createProjectUseCases } from './application/project-use-cases'
import { httpProjectRepository } from './infrastructure/http-project-repository'

export const projects = createProjectUseCases(httpProjectRepository)
export { normalizeProjectContent } from './domain/project'
export type { ProjectContent, ProjectRecord, ProjectWrite } from './domain/project'
