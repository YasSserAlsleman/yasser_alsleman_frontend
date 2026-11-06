export type LocalizedProjectText = { en: string; ar: string }
export type ProjectContentValue = { en?: string; ar?: string }
export type PopulatedProjectImage = { _id?: string; secureUrl?: string }

export type ProjectContentRecord = {
  title: ProjectContentValue
  slug: string
  category?: ProjectContentValue
  summary?: ProjectContentValue
  description?: ProjectContentValue
  technologies?: string[]
  location?: ProjectContentValue
  year?: number
  cover?: string | PopulatedProjectImage | null
  images?: Array<{ media: string | (PopulatedProjectImage & { _id: string }); alt?: ProjectContentValue; order: number }>
  problem?: ProjectContentValue
  solution?: ProjectContentValue
  role?: ProjectContentValue
  challenges?: ProjectContentValue
  decisions?: ProjectContentValue
  implementation?: ProjectContentValue
  results?: ProjectContentValue
  seo?: { title?: ProjectContentValue; description?: ProjectContentValue }
}

export type ProjectContent = {
  title: LocalizedProjectText
  slug: string
  category: LocalizedProjectText
  summary: LocalizedProjectText
  description: LocalizedProjectText
  technologies: string[]
  location: LocalizedProjectText
  year?: number
  cover?: string | null
  images: Array<{ media: string; alt?: LocalizedProjectText; order: number }>
  problem: LocalizedProjectText
  solution: LocalizedProjectText
  role: LocalizedProjectText
  challenges: LocalizedProjectText
  decisions: LocalizedProjectText
  implementation: LocalizedProjectText
  results: LocalizedProjectText
  seo: { title: LocalizedProjectText; description: LocalizedProjectText }
}

export type ProjectRecord = {
  _id: string
  content: ProjectContentRecord
  draft?: ProjectContentRecord
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  order: number
  updatedAt?: string
}

export type ProjectWrite = { content: ProjectContent; featured?: boolean; order?: number }

const localized = (value?: ProjectContentValue): LocalizedProjectText => ({
  en: value?.en || '',
  ar: value?.ar || '',
})

export function normalizeProjectContent(content: ProjectContentRecord): ProjectContent {
  const cover = content.cover
  return {
    title: localized(content.title),
    slug: content.slug,
    category: localized(content.category),
    summary: localized(content.summary),
    description: localized(content.description),
    technologies: content.technologies || [],
    location: localized(content.location),
    year: content.year,
    cover: typeof cover === 'string' ? cover : cover?._id || null,
    images: (content.images || []).map((image) => ({
      media: typeof image.media === 'string' ? image.media : image.media._id,
      alt: localized(image.alt),
      order: image.order,
    })),
    problem: localized(content.problem),
    solution: localized(content.solution),
    role: localized(content.role),
    challenges: localized(content.challenges),
    decisions: localized(content.decisions),
    implementation: localized(content.implementation),
    results: localized(content.results),
    seo: {
      title: localized(content.seo?.title),
      description: localized(content.seo?.description),
    },
  }
}
