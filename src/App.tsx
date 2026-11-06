import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness,
  Check, ChevronDown, ChevronLeft, ChevronRight, Code2,
  ExternalLink, Eye, FileText, FolderKanban, Globe2, Grid2X2, Image, LayoutDashboard,
  List, LogOut, Mail, Menu, Moon, MoreHorizontal, PanelLeftClose, PanelLeftOpen,
  Plus, Search, Settings2, ShieldCheck, Sun, X,
} from 'lucide-react'
import { apiRequest, setCsrfToken } from './shared/infrastructure/api-client'
import { normalizeProjectContent, projects as projectUseCases, type ProjectContent } from './features/projects'
import './App.css'

type Language = 'en' | 'ar'
type Project = { id: string; name: string; category: string; status: 'Published' | 'Draft' | 'Archived'; updated: string; featured: boolean; color: string; stack: string[]; cover?: string }
const currentYear = new Date().getFullYear()
const dashboardDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()

const copy = {
  en: {
    nav: ['About', 'Services', 'Projects', 'Articles', 'Contact'],
    eyebrow: 'SOFTWARE ENGINEER · BUILDING FOR THE REAL WORLD',
    headline: <>Good ideas deserve<br /><em>good engineering.</em></>,
    intro: 'I turn business requirements into dependable digital products — from the first system diagram to the details people use every day.',
    contact: 'Let’s talk', work: 'Explore selected work', available: 'Available for select projects',
    aboutLabel: 'A practical approach', aboutTitle: <>Thoughtful systems.<br /><em>Useful by design.</em></>,
    about: 'I work across mobile, web, and backend systems to bring connected products to life. My focus is on clear architecture, considered interfaces, and software that is straightforward to maintain.',
    servicesLabel: 'Ways I can help', projectsLabel: 'Selected work', projectsTitle: <>Built with care,<br /><em>from interface to API.</em></>,
    articlesLabel: 'NOTES ON THE WORK', articlesTitle: 'Ideas worth working through.',
    processLabel: 'A clear path from idea to release', process: ['Understand the problem', 'Shape the solution', 'Build in small steps', 'Test and refine', 'Ship with confidence'],
    contactLabel: 'Have something in mind?', contactTitle: <>Let’s make it<br /><em>work in the real world.</em></>,
    footer: 'Independent software engineering · Mobile, web & backend',
    serviceItems: [
      ['Mobile applications', 'Native-feeling iOS and Android products built with Flutter and Dart.'],
      ['Backend & APIs', 'Reliable services, REST APIs, and data models designed for real use.'],
      ['Web applications', 'Fast, accessible interfaces built with React and modern web tools.'],
      ['Connected products', 'Mobile, web, and backend systems designed to work as one.'],
    ],
  },
  ar: {
    nav: ['نبذة', 'الخدمات', 'الأعمال', 'مقالات', 'تواصل'],
    eyebrow: 'مهندس برمجيات · أبني حلولاً للعالم الحقيقي',
    headline: <>الأفكار الجيدة<br /><em>تستحق هندسة جيدة.</em></>,
    intro: 'أحوّل متطلبات الأعمال إلى منتجات رقمية موثوقة، بدءاً من مخطط النظام ووصولاً إلى التفاصيل التي يستخدمها الناس كل يوم.',
    contact: 'لنتحدث', work: 'استكشف الأعمال', available: 'متاح لمشاريع مختارة',
    aboutLabel: 'نهج عملي', aboutTitle: <>أنظمة مدروسة.<br /><em>مصممة لتكون مفيدة.</em></>,
    about: 'أعمل على تطبيقات الجوال والويب والأنظمة الخلفية لبناء منتجات مترابطة. أركز على بنية واضحة وواجهات مدروسة وبرمجيات يسهل صيانتها.',
    servicesLabel: 'كيف أستطيع المساعدة', projectsLabel: 'أعمال مختارة', projectsTitle: <>بُنيت بعناية،<br /><em>من الواجهة إلى الواجهة البرمجية.</em></>,
    articlesLabel: 'ملاحظات حول العمل', articlesTitle: 'أفكار تستحق التأمل.',
    processLabel: 'خطوات واضحة من الفكرة إلى الإطلاق', process: ['فهم المشكلة', 'تشكيل الحل', 'التطوير بخطوات', 'الاختبار والتحسين', 'الإطلاق بثقة'],
    contactLabel: 'هل لديك فكرة؟', contactTitle: <>لنجعلها تعمل<br /><em>في العالم الحقيقي.</em></>,
    footer: 'هندسة برمجيات مستقلة · تطبيقات الجوال والويب والأنظمة الخلفية',
    serviceItems: [
      ['تطبيقات الجوال', 'منتجات iOS وAndroid بتجربة طبيعية باستخدام Flutter وDart.'],
      ['الأنظمة الخلفية وواجهات API', 'خدمات موثوقة وواجهات REST ونماذج بيانات للاستخدام الفعلي.'],
      ['تطبيقات الويب', 'واجهات سريعة ومتاحة باستخدام React وأدوات الويب الحديثة.'],
      ['المنتجات المترابطة', 'أنظمة جوال وويب وخلفية تعمل كمنتج واحد.'],
    ],
  },
}

const sideLinks = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { label: 'Profile', icon: BriefcaseBusiness, path: '/admin/profile' },
  { label: 'Projects', icon: FolderKanban, path: '/admin/projects' },
  { label: 'Services', icon: Code2, path: '/admin/services' },
  { label: 'Articles', icon: FileText, path: '/admin/articles' },
  { label: 'Testimonials', icon: Check, path: '/admin/testimonials' },
  { label: 'Pages & sections', icon: Grid2X2, path: '/admin/pages' },
  { label: 'Messages', icon: Mail, path: '/admin/messages' },
  { label: 'Media library', icon: Image, path: '/admin/media' },
  { label: 'Analytics', icon: Eye, path: '/admin/analytics' },
]

function App() {
  const [route, setRoute] = useState(window.location.hash.replace('#', '') || '/')
  const [language, setLanguage] = useState<Language>('en')
  const [dashboardLanguage, setDashboardLanguage] = useState<Language>('en')
  const [light, setLight] = useState(() => localStorage.getItem('site-theme') === 'light')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [projectStatus, setProjectStatus] = useState('')
  const [projectPage, setProjectPage] = useState(1)
  const [projectPageCount, setProjectPageCount] = useState(1)
  const [projectTotal, setProjectTotal] = useState(0)
  const [tableView, setTableView] = useState(false)
  const [editorTab, setEditorTab] = useState('Basic information')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState('')
  const [availability, setAvailability] = useState<boolean | null>(null)
  const isAdmin = route.startsWith('/admin')
  const c = copy[language]
  const page = route.split('/')[2] || 'overview'
  const setPath = (path: string) => { window.location.hash = path }
  const toggleTheme = () => {
    setLight((current) => {
      const next = !current
      localStorage.setItem('site-theme', next ? 'light' : 'dark')
      return next
    })
  }
  const [adminState, setAdminState] = useState<'checking' | 'anonymous' | 'authenticated'>('checking')
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => {
    const change = () => setRoute(window.location.hash.replace('#', '') || '/')
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])

  useEffect(() => {
    let active = true
    if (!isAdmin) return () => { active = false }
    const timer = window.setTimeout(() => {
      setAdminState('checking')
      apiRequest<{ admin: { email: string }; csrfToken: string }>('/auth/session', { method: 'GET', csrf: false })
        .then(({ admin, csrfToken }) => {
          if (!active) return
          setCsrfToken(csrfToken)
          setAdminEmail(admin.email)
          setAdminState('authenticated')
        })
        .catch(() => {
          if (!active) return
          setCsrfToken('')
          setAdminState('anonymous')
        })
    }, 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [isAdmin])

  useEffect(() => {
    const expire = () => {
      setCsrfToken('')
      setAdminState('anonymous')
      if (window.location.hash.startsWith('#/admin') && !window.location.hash.includes('/login')) {
        window.location.hash = '/admin/login'
      }
    }
    window.addEventListener('cms:unauthorized', expire)
    return () => window.removeEventListener('cms:unauthorized', expire)
  }, [])

  useEffect(() => {
    if (!isAdmin || page !== 'projects' || adminState !== 'authenticated') return
    let active = true
    const timer = window.setTimeout(() => {
      setProjectsLoading(true)
      setProjectsError('')
      const params = new URLSearchParams({ search: query, page: String(projectPage), limit: '20' })
      if (projectStatus) params.set('status', projectStatus)
      projectUseCases.list(params)
        .then(({ data, pagination }) => {
          if (!active) return
          setProjectPageCount(pagination.pages)
          setProjectTotal(pagination.total)
          setProjects(data.map((item) => ({
            id: item._id,
            name: item.content.title.en || item.content.title.ar || 'Untitled project',
            category: item.content.category?.en || item.content.category?.ar || 'Uncategorized',
            status: item.status === 'published' ? 'Published' : item.status === 'archived' ? 'Archived' : 'Draft',
            updated: new Date(item.updatedAt).toLocaleDateString(),
            featured: item.featured,
            color: 'project-neutral',
            stack: item.content.technologies || [],
            cover: typeof item.content.cover === 'object' && item.content.cover ? item.content.cover.secureUrl : undefined,
          })))
        })
        .catch((error: unknown) => {
          if (active) setProjectsError(error instanceof Error ? error.message : 'Could not load projects.')
        })
        .finally(() => { if (active) setProjectsLoading(false) })
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [adminState, isAdmin, page, projectPage, projectStatus, query])

  useEffect(() => {
    const activeLanguage = isAdmin ? dashboardLanguage : language
    document.documentElement.lang = activeLanguage
    document.documentElement.dir = activeLanguage === 'ar' ? 'rtl' : 'ltr'
  }, [dashboardLanguage, isAdmin, language])

  useEffect(() => {
    if (isAdmin) return
    apiRequest('/public/analytics', {
      method: 'POST',
      csrf: false,
      body: JSON.stringify({ path: route || '/' }),
    }).catch((error: unknown) => console.warn('Privacy-minimal page analytics could not be recorded.', error))
  }, [isAdmin, route])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const filteredProjects = useMemo(() => projects, [projects])
  const notify = useCallback((message: string) => setNotice(message), [])
  const login = async (email: string, password: string) => {
    const result = await apiRequest<{ admin: { email: string }; csrfToken: string }>('/auth/login', {
      method: 'POST', csrf: false, body: JSON.stringify({ email, password }),
    })
    setCsrfToken(result.csrfToken)
    setAdminEmail(result.admin.email)
    setAdminState('authenticated')
    setPath('/admin')
  }
  const logout = async () => {
    await apiRequest<void>('/auth/logout', { method: 'POST', body: '{}' })
    setCsrfToken('')
    setAdminState('anonymous')
    setPath('/admin/login')
  }

  return (
    <div className={`app ${light ? 'theme-light' : ''} ${isAdmin ? 'admin-app' : 'public-app'}`} dir={(isAdmin ? dashboardLanguage : language) === 'ar' ? 'rtl' : 'ltr'}>
      {isAdmin && adminState === 'checking' ? <AuthGate onRetry={() => window.location.reload()} /> : null}
      {isAdmin && adminState === 'anonymous' ? <LoginPage onLogin={login} /> : null}
      {isAdmin && adminState === 'authenticated' ? (
        <div className="admin-shell">
          <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileNav ? 'is-open' : ''}`}>
            <a className="admin-brand" href="#/admin" aria-label="CMS overview">
              <span className="brand-mark">Y<span>.</span></span>
              {!collapsed && <span className="brand-copy"><b>YASSER ALSLEMAN</b><small>PERSONAL BRAND CMS</small></span>}
            </a>
            <div className="side-label">{!collapsed && 'WORKSPACE'}</div>
            <nav className="side-nav">
              {sideLinks.map(({ label, icon: Icon, path }) => {
                const active = path === '/admin' ? page === 'overview' : route === path || route.startsWith(path + '/')
                return <a key={path} href={`#${path}`} className={active ? 'active' : ''} title={collapsed ? label : undefined} onClick={() => setMobileNav(false)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Messages' && !collapsed && <b className="nav-count">2</b>}</a>
              })}
            </nav>
            {!collapsed && <div className="sidebar-bottom">
              <div className="side-label">PREFERENCES</div>
              <a href="#/admin/seo"><Globe2 size={18} /><span>SEO settings</span></a>
              <a href="#/admin/settings"><Settings2 size={18} /><span>Settings</span></a>
              <button className="sidebar-profile" onClick={() => void logout()} title="Sign out"><span className="avatar">YA</span><div><b>{adminEmail}</b><small>Administrator · Sign out</small></div><LogOut size={16} /></button>
            </div>}
            <button className="collapse-toggle" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
          </aside>
          <div className="admin-main">
            <header className="topbar">
              <button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation">{mobileNav ? <X size={19} /> : <Menu size={19} />}</button>
              <div className="crumb"><span>Workspace</span><ChevronRight size={14} /><b>{pageLabel(page)}</b></div>
              <div className="top-actions">
                <a className="preview-link" href="#/" title="View public website"><ExternalLink size={16} /><span>View website</span></a>
                <button className="top-locale" onClick={() => setDashboardLanguage(dashboardLanguage === 'en' ? 'ar' : 'en')} aria-label="Change dashboard language">{dashboardLanguage === 'en' ? 'EN' : 'ع'} <ChevronDown size={13} /></button>
                <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">{light ? <Moon size={17} /> : <Sun size={17} />}</button>
                <button className="icon-btn notification-btn" aria-label="Notifications" onClick={() => notify('You’re all caught up.')}><Bell size={17} /><i /></button>
              </div>
            </header>
            <div className="demo-strip"><span className="demo-dot" /> LIVE CMS <span>Connected content is loaded from the secured API.</span></div>
            <main className="dashboard-content">
              {page === 'overview' && <Overview />}
              {page === 'projects' && <ProjectsPage projects={filteredProjects} query={query} setQuery={(value) => { setQuery(value); setProjectPage(1) }} status={projectStatus} setStatus={(value) => { setProjectStatus(value); setProjectPage(1) }} currentPage={projectPage} pageCount={projectPageCount} total={projectTotal} setPage={setProjectPage} tableView={tableView} setTableView={setTableView} setPath={setPath} loading={projectsLoading} error={projectsError} />}
              {page === 'project-editor' && <ProjectEditor key={route.split('/')[3] || 'new'} id={route.split('/')[3]} tab={editorTab} setTab={setEditorTab} notify={notify} setPath={setPath} />}
              {page === 'profile' && <ProfilePage availability={availability} setAvailability={setAvailability} notify={notify} />}
              {page === 'messages' && <MessagesPage notify={notify} />}
              {page === 'testimonials' && <TestimonialsManager notify={notify} />}
              {page === 'services' && <ServicesManager notify={notify} />}
              {page === 'articles' && <ArticlesManager notify={notify} />}
              {page === 'pages' && <SectionsManager notify={notify} />}
              {page === 'media' && <MediaManager notify={notify} />}
              {page === 'analytics' && <AnalyticsPage />}
              {page === 'seo' && <SeoSettings notify={notify} />}
              {page === 'settings' && <WorkspaceSettings notify={notify} />}
              {!['overview', 'projects', 'project-editor', 'profile', 'messages', 'testimonials', 'services', 'articles', 'pages', 'media', 'analytics', 'seo', 'settings'].includes(page) && <Overview />}
            </main>
          </div>
          {mobileNav && <button className="drawer-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
        </div>
      ) : !isAdmin ? <PublicSite c={c} language={language} setLanguage={setLanguage} availability={availability} route={route} light={light} toggleTheme={toggleTheme} /> : null}
      {notice && <div className="toast"><span className="toast-check"><Check size={14} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14} /></button></div>}
    </div>
  )
}

function pageLabel(page: string) {
  const labels: Record<string, string> = { overview: 'Overview', profile: 'Profile', projects: 'Projects', 'project-editor': 'Project editor', services: 'Services', articles: 'Articles', testimonials: 'Testimonials', pages: 'Pages & sections', messages: 'Messages', media: 'Media library', analytics: 'Analytics', seo: 'SEO settings', settings: 'Settings' }
  return labels[page] || 'Overview'
}

function AuthGate({ onRetry }: { onRetry: () => void }) {
  return <main className="auth-page"><section className="auth-card"><span className="brand-mark">Y<span>.</span></span><h1>Checking your session</h1><p>Verifying administrator access with the CMS server.</p><button className="button-outline" onClick={onRetry}>Try again</button></section></main>
}

function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onLogin(email, password)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><a href="#/" className="wordmark">YASSER<span>.</span><small>PERSONAL BRAND CMS</small></a><div className="overline">ADMINISTRATOR ACCESS</div><h1>Sign in</h1><p>Use the administrator account configured for this installation.</p>{error && <div role="alert" className="auth-error">{error}</div>}<label className="field-label">Email address<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="field-label">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button-dark auth-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ArrowRight size={15} /></button><small>Administrator accounts are provisioned securely; public registration is disabled.</small></form></main>
}

function PublicSite({ c, language, setLanguage, availability, route, light, toggleTheme }: { c: typeof copy.en; language: Language; setLanguage: (language: Language) => void; availability: boolean | null; route: string; light: boolean; toggleTheme: () => void }) {
  type PublicProject = { _id: string; content: { title: { en?: string; ar?: string }; slug: string; category?: { en?: string; ar?: string }; summary?: { en?: string; ar?: string }; description?: { en?: string; ar?: string }; problem?: { en?: string; ar?: string }; solution?: { en?: string; ar?: string }; role?: { en?: string; ar?: string }; challenges?: { en?: string; ar?: string }; decisions?: { en?: string; ar?: string }; implementation?: { en?: string; ar?: string }; results?: { en?: string; ar?: string }; technologies: string[]; cover?: { secureUrl: string } | null; images?: Array<{ alt?: { en?: string; ar?: string }; media: { secureUrl: string } }> } }
  type PublicArticle = { _id: string; content: { title: { en?: string; ar?: string }; slug: string; summary?: { en?: string; ar?: string }; body?: { en?: string; ar?: string }; category?: { en?: string; ar?: string }; cover?: { secureUrl: string } | null; publishedAt?: string } }
  type PublicContent = {
    profile?: { name?: { en?: string; ar?: string }; title?: { en?: string; ar?: string }; introduction?: { en?: string; ar?: string }; biography?: { en?: string; ar?: string }; location?: { en?: string; ar?: string }; socials?: Record<string, string>; availability?: boolean; email?: string; profileImage?: { secureUrl: string; width?: number; height?: number } | null }
    settings?: { brandName?: { en?: string; ar?: string }; brandInfo?: { en?: string; ar?: string }; footer?: { en?: string; ar?: string }; contactEmail?: string; socials?: Record<string, string>; languages?: Language[]; defaultLanguage?: Language; logo?: { secureUrl: string } | null }
    projects: PublicProject[]
    services: Array<{ _id: string; title: { en?: string; ar?: string }; description: { en?: string; ar?: string } }>
    articles: PublicArticle[]
    testimonials: Array<{ _id: string; author: { en?: string; ar?: string }; role?: { en?: string; ar?: string }; quote: { en?: string; ar?: string } }>
    sections: Array<{ key: string; title: { en?: string; ar?: string }; content: { en?: string; ar?: string }; enabled: boolean }>
  }
  const articleSlug = route.startsWith('/articles/') ? decodeURIComponent(route.slice('/articles/'.length)) : ''
  const projectSlug = route.startsWith('/projects/') ? decodeURIComponent(route.slice('/projects/'.length)) : ''
  const [navOpen, setNavOpen] = useState(false)
  const [publicContent, setPublicContent] = useState<PublicContent | null>(null)
  const [publicError, setPublicError] = useState('')
  const [article, setArticle] = useState<PublicArticle | null>(null)
  const [articleError, setArticleError] = useState<{ slug: string; message: string } | null>(null)
  const [project, setProject] = useState<PublicProject | null>(null)
  const [projectError, setProjectError] = useState<{ slug: string; message: string } | null>(null)
  const [contactBusy, setContactBusy] = useState(false)
  const [contactSuccess, setContactSuccess] = useState('')
  const [contactError, setContactError] = useState('')
  const inquiryKey = useRef(crypto.randomUUID())
  const languageChangedByVisitor = useRef(false)
  const currentArticle = article?.content.slug === articleSlug ? article : null
  const currentProject = project?.content.slug === projectSlug ? project : null
  const currentArticleError = articleError?.slug === articleSlug ? articleError.message : ''
  const currentProjectError = projectError?.slug === projectSlug ? projectError.message : ''
  useEffect(() => {
    let active = true
    apiRequest<{ data: PublicContent }>('/public/home', { method: 'GET', csrf: false })
      .then(({ data }) => { if (active) setPublicContent(data) })
      .catch((reason: unknown) => { if (active) setPublicError(reason instanceof Error ? reason.message : 'Public content could not be loaded.') })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!articleSlug) return
    let active = true
    apiRequest<{ data: PublicArticle }>(`/public/articles/${encodeURIComponent(articleSlug)}`, { method: 'GET', csrf: false })
      .then(({ data }) => { if (active) { setArticle(data); setArticleError(null) } })
      .catch((reason: unknown) => { if (active) setArticleError({ slug: articleSlug, message: reason instanceof Error ? reason.message : 'Article could not be loaded.' }) })
    return () => { active = false }
  }, [articleSlug])
  useEffect(() => {
    const defaultLanguage = publicContent?.settings?.defaultLanguage
    if (defaultLanguage && !languageChangedByVisitor.current) setLanguage(defaultLanguage)
  }, [publicContent?.settings?.defaultLanguage, setLanguage])
  useEffect(() => {
    if (!projectSlug) return
    let active = true
    apiRequest<{ data: PublicProject }>(`/public/projects/${encodeURIComponent(projectSlug)}`, { method: 'GET', csrf: false })
      .then(({ data }) => { if (active) { setProject(data); setProjectError(null) } })
      .catch((reason: unknown) => { if (active) setProjectError({ slug: projectSlug, message: reason instanceof Error ? reason.message : 'Project could not be loaded.' }) })
    return () => { active = false }
  }, [projectSlug])
  const sendInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setContactBusy(true)
    setContactError('')
    const values = new FormData(form)
    try {
      const response = await apiRequest<{ data: { inquiryId: string } }>('/public/inquiries', {
        method: 'POST',
        csrf: false,
        headers: { 'Idempotency-Key': inquiryKey.current },
        body: JSON.stringify({
          name: values.get('name'),
          email: values.get('email'),
          subject: '',
          message: values.get('message'),
          website: values.get('website') || '',
        }),
      })
      setContactSuccess(language === 'en' ? `Message received. Reference: ${response.data.inquiryId}` : `تم استلام الرسالة. رقم المتابعة: ${response.data.inquiryId}`)
      inquiryKey.current = crypto.randomUUID()
      form.reset()
    } catch (reason) {
      setContactError(reason instanceof Error ? reason.message : 'Message could not be sent. Please try again.')
    } finally { setContactBusy(false) }
  }
  const getText = (values?: { en?: string; ar?: string }) => values?.[language] || values?.en || values?.ar || ''
  const switchLanguage = () => {
    languageChangedByVisitor.current = true
    const supported = publicContent?.settings?.languages || ['en', 'ar']
    const next = language === 'en' ? 'ar' : 'en'
    setLanguage(supported.includes(next) ? next : supported[0])
  }
  const section = (key: string) => publicContent?.sections.find((item) => item.key === key)
  const showSection = (key: string) => !publicContent?.sections.length || section(key)?.enabled !== false
  const available = publicContent?.profile?.availability ?? availability
  const brandName = getText(publicContent?.settings?.brandName) || getText(publicContent?.profile?.name) || 'YASSER'
  const profileName = getText(publicContent?.profile?.name)
  const profileTitle = getText(publicContent?.profile?.title)
  const profileLocation = getText(publicContent?.profile?.location)
  const profileSocials = publicContent?.profile?.socials || {}
  const profilePortrait = publicContent?.profile?.profileImage
  const logoUrl = publicContent?.settings?.logo?.secureUrl
  const brand = <>{logoUrl ? <img className="site-logo" src={logoUrl} alt={brandName}/> : <>{brandName}<span>.</span><small>SOFTWARE ENGINEER</small></>}</>
  if (articleSlug) return <div className={`portfolio article-detail-portfolio ${light ? 'theme-light' : ''}`}>
    <header className="site-header"><a href="#/" className="wordmark">{brand}</a><div className="site-actions"><button className="language-toggle" onClick={switchLanguage}>{language === 'en' ? 'عربي' : 'EN'}</button><button className="language-toggle theme-toggle" onClick={toggleTheme} aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}>{light ? <Moon size={17} /> : <Sun size={17} />}</button><a className="site-contact" href="#/">{language==='en'?'Back to home':'العودة للرئيسية'}<ArrowUpRight size={15}/></a></div></header>
    <main className="article-detail-page section-wrap">{currentArticle ? <article><a className="underlined-link" href="#/">{language==='en'?'← All articles':'→ كل المقالات'}</a><p className="section-kicker">{getText(currentArticle.content.category)}</p><h1>{getText(currentArticle.content.title)}</h1>{currentArticle.content.summary && <p className="article-detail-summary">{getText(currentArticle.content.summary)}</p>}{currentArticle.content.cover?.secureUrl && <img className="article-detail-cover" src={currentArticle.content.cover.secureUrl} alt={getText(currentArticle.content.title)}/>}<div className="article-detail-body" dir={language==='ar'?'rtl':'ltr'}>{getText(currentArticle.content.body)}</div></article> : <div className="public-empty" role={currentArticleError?'alert':'status'}>{currentArticleError || (language==='en'?'Loading article…':'جارٍ تحميل المقال…')}</div>}</main>
    <footer className="site-footer"><a href="#/" className="wordmark">{brand}</a><p>{getText(publicContent?.settings?.footer) || c.footer}</p></footer>
  </div>
  if (projectSlug) return <div className={`portfolio article-detail-portfolio ${light ? 'theme-light' : ''}`}>
    <header className="site-header"><a href="#/" className="wordmark">{brand}</a><div className="site-actions"><button className="language-toggle" onClick={switchLanguage}>{language === 'en' ? 'عربي' : 'EN'}</button><button className="language-toggle theme-toggle" onClick={toggleTheme} aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}>{light ? <Moon size={17} /> : <Sun size={17} />}</button><a className="site-contact" href="#/">{language==='en'?'Back to work':'العودة للأعمال'}<ArrowUpRight size={15}/></a></div></header>
    <main className="project-detail-page section-wrap">{currentProject ? <article><a className="underlined-link" href="#/">{language==='en'?'← All projects':'→ كل المشاريع'}</a><p className="section-kicker">{getText(currentProject.content.category)}</p><h1>{getText(currentProject.content.title)}</h1><p className="article-detail-summary">{getText(currentProject.content.summary)}</p>{currentProject.content.cover?.secureUrl&&<img className="article-detail-cover" src={currentProject.content.cover.secureUrl} alt={getText(currentProject.content.title)}/>}<div className="tag-row">{currentProject.content.technologies.map((technology)=><span key={technology}>{technology}</span>)}</div>{(['description','problem','solution','role','challenges','decisions','implementation','results'] as const).map((field)=><section className="project-story-section" key={field}>{getText(currentProject.content[field])&&<><h2>{field[0].toUpperCase()+field.slice(1)}</h2><p>{getText(currentProject.content[field])}</p></>}</section>)}{currentProject.content.images?.map((image,index)=><img className="article-detail-cover" src={image.media.secureUrl} alt={getText(image.alt)||`${getText(currentProject.content.title)} image ${index+1}`} key={`${image.media.secureUrl}-${index}`}/>)}</article> : <div className="public-empty" role={currentProjectError?'alert':'status'}>{currentProjectError || (language==='en'?'Loading project…':'جارٍ تحميل المشروع…')}</div>}</main>
    <footer className="site-footer"><a href="#/" className="wordmark">{brand}</a><p>{getText(publicContent?.settings?.footer) || c.footer}</p></footer>
  </div>
  return <div className={`portfolio ${light ? 'theme-light' : ''}`}>
    <header className="site-header">
      <a href="#/" className="wordmark">{brand}</a>
      <nav className={`site-nav ${navOpen ? 'mobile-open' : ''}`} id="portfolio-navigation">{c.nav.map((item, index) => <a key={item} href={`#${['about', 'services', 'work', 'articles', 'contact'][index]}`} onClick={() => setNavOpen(false)}>{item}</a>)}</nav>
      <div className="site-actions"><button className="language-toggle" onClick={switchLanguage}>{language === 'en' ? 'عربي' : 'EN'}</button><button className="language-toggle theme-toggle" onClick={toggleTheme} aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}>{light ? <Moon size={17} /> : <Sun size={17} />}</button><a className="site-contact" href="#contact">{c.contact}<ArrowUpRight size={15} /></a><button className="site-menu" aria-label={navOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={navOpen} aria-controls="portfolio-navigation" onClick={() => setNavOpen(!navOpen)}>{navOpen ? <X size={17} /> : <Menu size={17} />}</button></div>
    </header>
    <main>
      {showSection('hero') && <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-rule" />{getText(publicContent?.profile?.title) || c.eyebrow}</div>
          {profileName && <p className="hero-name">{profileName}</p>}
          <h1>{getText(section('hero')?.title) || c.headline}</h1>
          <p className="hero-intro">{getText(publicContent?.profile?.introduction) || getText(section('hero')?.content) || getText(publicContent?.settings?.brandInfo) || c.intro}</p>
          <div className="hero-ctas"><a className="button-primary" href="#contact">{c.contact}<ArrowUpRight size={17} /></a><a className="text-link" href="#work">{c.work}<ArrowRight size={15} /></a></div>
          {(profileSocials.linkedin || profileSocials.github) && <nav className="hero-socials" aria-label={language === 'en' ? 'Social profiles' : 'الحسابات الاجتماعية'}>
            {(['linkedin', 'github'] as const).map((network) => profileSocials[network] && <a key={network} href={profileSocials[network]} target="_blank" rel="noreferrer noopener">{network === 'linkedin' ? 'LinkedIn' : 'GitHub'}<ArrowUpRight size={12} /></a>)}
          </nav>}
          <div className="availability"><i className={available ? 'online' : ''} />{available === true ? c.available : available === false ? (language === 'en' ? 'Not available for new projects' : 'غير متاح لمشاريع جديدة') : (language === 'en' ? 'Availability not set' : 'حالة التوفر غير محددة')}</div>
        </div>
        <div className="hero-art" aria-label={profilePortrait ? profileName || 'Profile portrait' : 'Abstract architectural illustration'}>
          <div className="art-frame">
            <div className="art-grid" />
            <div className="art-circle" />
            <div className="art-ring" />
            {profilePortrait ? <div className="art-portrait-card">
              <img src={profilePortrait.secureUrl} alt={profileName || 'Profile portrait'} />
              <div className="art-portrait-caption">
                <strong>{profileName || 'SOFTWARE ENGINEER'}</strong>
                {profileTitle && <span>{profileTitle}</span>}
                {profileLocation && <span>{profileLocation}</span>}
              </div>
            </div> : <div className="art-panel">
              <span className="panel-kicker">SYSTEMS / 2026</span>
              <div className="panel-lines"><i /><i /><i /></div>
              <div className="panel-code"><b>01</b><span>DESIGN WITH INTENT</span></div>
            </div>}
            <span className="art-coordinate">ARCHITECTURE / 001</span>
          </div>
          <div className="art-caption"><span>ENGINEERED TO BE USEFUL</span><ArrowUpRight size={15} /></div>
        </div>
        <a className="scroll-note" href="#about"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></a>
      </section>}
      {showSection('about') && <section className="intro-section section-wrap" id="about">
        <div className="section-index"><span>01</span> / ABOUT</div>
        <div className="intro-content"><p className="section-kicker">{c.aboutLabel}</p><h2>{getText(section('about')?.title) || c.aboutTitle}</h2><p className="body-copy">{getText(publicContent?.profile?.biography) || getText(section('about')?.content) || getText(publicContent?.profile?.introduction) || c.about}</p><a className="underlined-link" href="#contact">{language === 'en' ? 'A little more about how I work' : 'المزيد عن طريقة عملي'}<ArrowUpRight size={15} /></a></div>
        <div className="principle-note"><span className="note-symbol">“</span><p>{language === 'en' ? 'The best technology is the kind that quietly makes things work better.' : 'أفضل تقنية هي التي تجعل الأشياء تعمل بشكل أفضل بهدوء.'}</p><small>ENGINEERING PRINCIPLE</small></div>
      </section>}
      {showSection('services') && <section className="services-section" id="services"><div className="section-wrap">
        <div className="section-topline"><div className="section-index"><span>02</span> / SERVICES</div><p className="section-kicker">{getText(section('services')?.title) || c.servicesLabel}</p></div>
        <div className="services-grid">{publicContent ? publicContent.services.length ? publicContent.services.map((service, i) => <article className="service-item" key={service._id}><span className="service-number">0{i + 1}</span><div><h3>{getText(service.title)}</h3><p>{getText(service.description)}</p></div><ArrowUpRight size={17} /></article>) : <div className="public-empty">{language === 'en' ? 'No published services yet.' : 'لا توجد خدمات منشورة بعد.'}</div> : <div className="public-empty">{publicError || (language === 'en' ? 'Loading published services…' : 'جارٍ تحميل الخدمات المنشورة…')}</div>}</div>
      </div></section>}
      {showSection('projects') && <section className="work-section section-wrap" id="work">
        <div className="section-index"><span>03</span> / SELECTED WORK</div>
        <div className="work-heading"><div><p className="section-kicker">{c.projectsLabel}</p><h2>{getText(section('projects')?.title) || c.projectsTitle}</h2></div><p className="work-disclaimer">{language === 'en' ? 'Only published projects appear here.' : 'تظهر هنا المشاريع المنشورة فقط.'}</p></div>
        {publicContent ? publicContent.projects.length ? <div className="case-grid live-case-grid">{publicContent.projects.map((project, index) => <a href={`#/projects/${project.content.slug}`} className="case-card" key={project._id}><div className="case-art live-case-art">{project.content.cover?.secureUrl ? <img src={project.content.cover.secureUrl} alt={getText(project.content.title)} /> : <div className="case-placeholder"><span>PROJECT / {String(index + 1).padStart(2, '0')}</span><b>{getText(project.content.category)}</b></div>}</div><div className="case-meta"><div><span>{String(index + 1).padStart(2, '0')} / {getText(project.content.category) || 'PROJECT'}</span><h3>{getText(project.content.title)}</h3></div><ArrowUpRight size={18} /></div><p className="case-description">{getText(project.content.summary)}</p><div className="tag-row">{project.content.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div></a>)}</div> : <div className="public-empty">{language === 'en' ? 'No published projects yet.' : 'لا توجد مشاريع منشورة بعد.'}</div> : <div className="public-empty">{publicError || (language === 'en' ? 'Loading published projects…' : 'جارٍ تحميل المشاريع المنشورة…')}</div>}
      </section>}
      {showSection('articles') && <section className="journal-section" id="articles"><div className="section-wrap"><div className="section-index"><span>04</span> / JOURNAL</div><div className="journal-heading"><div><p className="section-kicker">{c.articlesLabel}</p><h2>{getText(section('articles')?.title) || c.articlesTitle}</h2></div><span>{language === 'en' ? 'PUBLISHED NOTES' : 'مقالات منشورة'}</span></div><div className="journal-list">{publicContent?.articles.map((post, index) => <a href={`#/articles/${post.content.slug}`} className="journal-item" key={post._id}><span>{String(index + 1).padStart(2, '0')} / {getText(post.content.category) || 'ARTICLE'}</span><h3>{getText(post.content.title)}</h3><p>{getText(post.content.summary)}</p><ArrowUpRight size={17} /></a>)}</div>{publicContent && publicContent.articles.length === 0 && <div className="public-empty">{language === 'en' ? 'No published articles yet.' : 'لا توجد مقالات منشورة بعد.'}</div>}</div></section>}
      {showSection('testimonials') && publicContent?.testimonials.length ? <section className="testimonials-section section-wrap"><div className="section-index"><span>05</span> / TESTIMONIALS</div><div className="testimonials-grid">{publicContent.testimonials.map((item)=><figure className="public-testimonial" key={item._id}><blockquote>{getText(item.quote)}</blockquote><figcaption><b>{getText(item.author)}</b>{getText(item.role)&&<span>{getText(item.role)}</span>}</figcaption></figure>)}</div></section>:null}
      {showSection('approach') && <section className="process-section"><div className="section-wrap process-layout"><div><div className="section-index"><span>06</span> / APPROACH</div><p className="section-kicker">{c.processLabel}</p><h2>{getText(section('approach')?.title) || (language === 'en' ? <>Good work starts<br />with <em>good questions.</em></> : <>العمل الجيد يبدأ<br /><em>بالأسئلة الجيدة.</em></>)}</h2><p>{getText(section('approach')?.content)}</p></div><ol>{c.process.map((step, i) => <li key={step}><span>0{i + 1}</span>{step}<ArrowUpRight size={15} /></li>)}</ol></div></section>}
      {showSection('contact') && <section className="contact-section section-wrap" id="contact"><div className="section-index"><span>06</span> / CONTACT</div><p className="section-kicker">{c.contactLabel}</p><h2>{c.contactTitle}</h2><div className="contact-bottom"><div><p>{language === 'en' ? 'Share a few details about your project. Your message will be sent securely.' : 'شارك بعض التفاصيل عن مشروعك، وستُرسل رسالتك بأمان.'}</p>{(publicContent?.settings?.contactEmail||publicContent?.profile?.email)&&<a className="contact-email" href={`mailto:${encodeURIComponent(publicContent.settings?.contactEmail||publicContent.profile?.email||'')}`}>{publicContent.settings?.contactEmail||publicContent.profile?.email}</a>}</div><form className="contact-form" onSubmit={(event) => void sendInquiry(event)}><label><span>{language === 'en' ? 'Your name' : 'الاسم'}</span><input required name="name" autoComplete="name" maxLength={120} /></label><label><span>{language === 'en' ? 'Email address' : 'البريد الإلكتروني'}</span><input required type="email" name="email" autoComplete="email" maxLength={254} /></label><label><span>{language === 'en' ? 'A little about your project' : 'أخبرني عن مشروعك'}</span><textarea required name="message" rows={3} maxLength={5000} /></label><label className="honeypot-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>{contactError && <p className="form-error" role="alert">{contactError}</p>}{contactSuccess && <p className="form-success" role="status">{contactSuccess}</p>}<button className="button-primary" type="submit" disabled={contactBusy}>{contactBusy ? (language === 'en' ? 'Sending…' : 'جارٍ الإرسال…') : (language === 'en' ? 'Send message' : 'إرسال الرسالة')}<ArrowUpRight size={17} /></button></form></div></section>}
    </main>
    <footer className="site-footer"><a href="#/" className="wordmark">{brand}</a><p>{getText(publicContent?.settings?.footer) || c.footer}</p><div>{Object.entries(publicContent?.settings?.socials || {}).filter(([,url])=>Boolean(url)).map(([name,url])=><a href={url} target="_blank" rel="noreferrer" key={name}>{name}</a>)}<a href="#/admin/login">Admin sign in</a><span>© {currentYear} {brandName}</span></div></footer>
  </div>
}

function Overview() {
  type OverviewData = {
    publishedProjects: number; draftProjects: number; articles: number; newInquiries: number; visits: number
    recentActivity: Array<{ _id: string; action: string; entity: string; summary: string; createdAt: string }>
    messages: Array<{ _id: string; name: string; subject: string; message: string }>
  }
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    apiRequest<{ data: OverviewData }>('/admin/overview')
      .then(({ data: result }) => setData(result))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load dashboard statistics.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])
  const stats = data ? [
    { label: 'Website visits', value: data.visits.toLocaleString(), note: 'Last 30 days', trend: '' },
    { label: 'Published projects', value: String(data.publishedProjects).padStart(2, '0'), note: `${data.draftProjects} drafts`, trend: '' },
    { label: 'Published articles', value: String(data.articles).padStart(2, '0'), note: 'Live on your website', trend: '' },
    { label: 'New inquiries', value: String(data.newInquiries).padStart(2, '0'), note: 'Awaiting review', trend: '' },
  ] : []
  return <>
    <div className="page-heading"><div><div className="overline">{dashboardDate}</div><h1>Dashboard <span className="wave">✳</span></h1><p>A live view of published content and recent inquiries.</p></div><div className="heading-actions"><button className="button-outline" onClick={() => { setLoading(true); setError(''); load() }} disabled={loading}><ArrowRight size={14} /> Refresh</button><a className="button-dark" href="#/" target="_blank" rel="noreferrer"><Eye size={16} /> Preview website <ArrowUpRight size={14} /></a></div></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    {loading && !data ? <div className="empty-state"><span className="loading-spinner" /><b>Loading dashboard data…</b></div> : data && <>
      <div className="stats-row">{stats.map((stat) => <Stat key={stat.label} {...stat} />)}</div>
      <div className="overview-grid"><section className="panel activity-panel"><div className="panel-heading"><div><span className="panel-eyebrow">RECENT ACTIVITY</span><h2>Recent changes</h2></div></div>{data.recentActivity.length ? <div className="activity-list">{data.recentActivity.map((item) => <div className="activity-row" key={item._id}><span className="activity-icon"><Check size={14} /></span><div><b>{item.action} {item.entity}</b><small>{item.summary}</small></div><time>{new Date(item.createdAt).toLocaleDateString()}</time></div>)}</div> : <div className="public-empty">Activity will appear here after content is updated.</div>}</section><section className="panel quick-panel"><span className="panel-eyebrow">NEW INQUIRIES</span><h2>Messages to review</h2>{data.messages.length ? data.messages.map((message) => <a className="quick-action" href="#/admin/messages" key={message._id}><span><Mail size={16} /></span><div><b>{message.name}</b><small>{message.subject || message.message.slice(0, 60)}</small></div><ArrowUpRight size={15} /></a>) : <div className="public-empty">No new inquiries.</div>}</section></div>
    </>}
  </>
}

function Stat({ label, value, note, trend }: { label: string; value: string; note: string; trend: string }) {
  return <div className="stat-card"><div><span>{label}</span>{trend && <small className={trend.startsWith('+') || trend.includes('new') ? 'stat-trend' : ''}>{trend}</small>}</div><strong>{value}</strong><p>{note}</p></div>
}
function ProjectsPage({ projects, query, setQuery, status, setStatus, currentPage, pageCount, total, setPage, tableView, setTableView, setPath, loading, error }: { projects: Project[]; query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; currentPage: number; pageCount: number; total: number; setPage: (page: number) => void; tableView: boolean; setTableView: (value: boolean) => void; setPath: (path: string) => void; loading: boolean; error: string }) {
  return <>
    <div className="page-heading"><div><div className="overline">CONTENT / PROJECTS</div><h1>Projects</h1><p>Manage the work featured across your portfolio.</p></div><button className="button-dark" onClick={() => setPath('/admin/project-editor')}><Plus size={16} /> Add project</button></div>
    <div className="project-toolbar"><div className="search-field"><Search size={16} /><input placeholder="Search projects..." value={query} onChange={(e) => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div><select className="filter-button" value={status} onChange={(event)=>setStatus(event.target.value)} aria-label="Filter projects by status"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select><div className="view-switch"><button className={!tableView ? 'selected' : ''} onClick={() => setTableView(false)} aria-label="Grid view"><Grid2X2 size={16} /></button><button className={tableView ? 'selected' : ''} onClick={() => setTableView(true)} aria-label="List view"><List size={17} /></button></div></div>
    {loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading projects…</b></div> : error ? <div className="request-error" role="alert">{error}</div> : tableView ? <div className="table-wrap"><table className="project-table"><thead><tr><th>PROJECT</th><th>CATEGORY</th><th>STATUS</th><th>UPDATED</th><th /></tr></thead><tbody>{projects.map((p) => <tr key={p.id}><td>{p.name}{p.featured && <span className="featured-mark">FEATURED</span>}</td><td>{p.category}</td><td><StatusBadge status={p.status} /></td><td>{p.updated}</td><td><button className="icon-btn" onClick={() => setPath(`/admin/project-editor/${p.id}`)} aria-label={`Edit ${p.name}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div> : <div className="project-cards">{projects.map((p) => <article className="project-admin-card" key={p.id}><div className="admin-project-art project-neutral"><span className="sample-label">{p.status.toUpperCase()}</span>{p.cover ? <img src={p.cover} alt={p.name} loading="lazy" /> : <div className="case-placeholder"><span>NO COVER IMAGE</span><b>{p.category}</b></div>}</div><div className="project-card-content"><div className="project-card-title"><div><h3>{p.name}</h3><p>{p.category}</p></div><button className="icon-btn" onClick={() => setPath(`/admin/project-editor/${p.id}`)} aria-label={`Edit ${p.name}`}><MoreHorizontal size={18} /></button></div><div className="tag-row">{p.stack.map((tag) => <span key={tag}>{tag}</span>)}{p.featured && <span className="featured-pill">★ Featured</span>}</div><div className="project-card-footer"><StatusBadge status={p.status} /><span>Updated {p.updated}</span></div></div></article>)}</div>}
    {!loading && !error && projects.length === 0 && <div className="empty-state"><Search size={22} /><b>{query ? `No projects match “${query}”` : 'No projects yet'}</b><span>{query ? 'Try a different search term.' : 'Create the first project to start your portfolio.'}</span></div>}
    {!loading && !error && <div className="pagination"><span>Showing <b>{projects.length}</b> of {total} projects</span><div><button onClick={()=>setPage(Math.max(1,currentPage-1))} disabled={currentPage<=1}><ChevronLeft size={15} /></button><button className="current-page">{currentPage} / {Math.max(pageCount,1)}</button><button onClick={()=>setPage(Math.min(pageCount,currentPage+1))} disabled={currentPage>=pageCount}><ChevronRight size={15} /></button></div></div>}
  </>
}
function StatusBadge({ status }: { status: Project['status'] }) { return <span className={`status-badge ${status.toLowerCase()}`}><i />{status}</span> }

function ProjectEditor({ id, tab, setTab, notify, setPath }: { id?: string; tab: string; setTab: (tab: string) => void; notify: (message: string) => void; setPath: (path: string) => void }) {
  type Localized = ProjectContent['title']
  type Content = ProjectContent
  const empty = (): Content => ({
    title: { en: '', ar: '' }, slug: '', category: { en: '', ar: '' }, summary: { en: '', ar: '' },
    description: { en: '', ar: '' }, technologies: [], location: { en: '', ar: '' }, cover: null, images: [],
    problem: { en: '', ar: '' }, solution: { en: '', ar: '' }, role: { en: '', ar: '' },
    challenges: { en: '', ar: '' }, decisions: { en: '', ar: '' }, implementation: { en: '', ar: '' },
    results: { en: '', ar: '' }, seo: { title: { en: '', ar: '' }, description: { en: '', ar: '' } },
  })
  const [content, setContent] = useState<Content>(empty)
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ar'>('en')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [featured, setFeatured] = useState(false)
  const [order, setOrder] = useState(0)
  const [savedAt, setSavedAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState('')
  const [media, setMedia] = useState<{ secureUrl: string; _id?: string } | null>(null)
  const [galleryPreview, setGalleryPreview] = useState<Array<{ id: string; secureUrl: string }>>([])
  const [dirty, setDirty] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const tabs = ['Basic information', 'Gallery', 'Case study', 'Translations', 'Publishing & SEO']

  useEffect(() => {
    if (!id) return
    let active = true
    projectUseCases.get(id)
      .then(({ data }) => {
        if (!active) return
        const selected = data.draft || data.content
        const cover = selected.cover
        const coverObject = cover && typeof cover === 'object' ? cover as { _id?: string; secureUrl?: string } : null
        const gallery = (selected.images || []).map((image) => {
          const value = image.media as unknown
          const populated = value && typeof value === 'object' && '_id' in value ? value as { _id: string; secureUrl?: string } : null
          return {
            entry: { ...image, media: populated?._id || String(value), alt: { en: image.alt?.en || '', ar: image.alt?.ar || '' } },
            preview: populated?.secureUrl ? { id: populated._id, secureUrl: populated.secureUrl } : null,
          }
        })
        setGalleryPreview(gallery.flatMap(({ preview }) => preview ? [preview] : []))
        setContent({
          ...normalizeProjectContent(selected),
          cover: coverObject?._id || (typeof cover === 'string' ? cover : null),
          images: gallery.map(({ entry }) => entry),
        })
        setStatus(data.status)
        setFeatured(data.featured)
        setOrder(data.order)
        if (coverObject?.secureUrl) setMedia({ secureUrl: coverObject.secureUrl, _id: coverObject._id })
        setDirty(false)
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load this project.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const updateLocalized = (field: keyof Content, value: string) => {
    setContent((current) => ({ ...current, [field]: { ...(current[field] as Localized), [activeLanguage]: value } }))
    setDirty(true)
  }
  const save = async (): Promise<string> => {
    setError('')
    const slug = content.slug.trim().toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    if (!slug) throw new Error('Enter a URL slug using English letters and numbers, separated by hyphens.')
    if (slug.length > 180) throw new Error('URL slug must be 180 characters or fewer.')
    const projectContent = { ...content, slug }
    if (slug !== content.slug) setContent(projectContent)
    setBusy(true)
    try {
      const projectId = await projectUseCases.saveDraft(id ?? null, { content: projectContent, featured, order })
      if (!id) setPath(`/admin/project-editor/${projectId}`)
      setDirty(false)
      setSavedAt(new Date().toLocaleString())
      return projectId
    } finally {
      setBusy(false)
    }
  }
  const saveDraft = async () => {
    try { await save(); notify('Draft saved successfully.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this project.') }
  }
  const publish = async () => {
    try {
      const projectId = await save()
      if (status === 'archived' || status === 'draft') await projectUseCases.setStatus(projectId, status)
      else await projectUseCases.publish(projectId)
      setStatus(status)
      setDirty(false)
      notify('Project published.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not publish this project.') }
  }
  const deleteProject = async () => {
    if (!id || !window.confirm('Delete this project? This cannot be undone.')) return
    setBusy(true)
    try {
      await projectUseCases.delete(id)
      notify('Project deleted.')
      setPath('/admin/projects')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete this project.') }
    finally { setBusy(false) }
  }
  const uploadCover = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, WebP, or AVIF image under 10 MB.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await apiRequest<{ data: { _id: string; secureUrl: string } }>('/admin/media', { method: 'POST', body: formData })
      setMedia(result.data)
      setContent((current) => ({ ...current, cover: result.data._id }))
      setDirty(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Image upload failed.') }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = '' }
  }
  const uploadGallery = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: choose a supported image under 10 MB.`)
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await apiRequest<{ data: { _id: string; secureUrl: string } }>('/admin/media', { method: 'POST', body: formData })
        setGalleryPreview((current) => [...current, { id: data._id, secureUrl: data.secureUrl }])
        setContent((current) => ({ ...current, images: [...current.images, { media: data._id, order: current.images.length, alt: { en: '', ar: '' } }] }))
      }
      setDirty(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Gallery upload failed.') }
    finally { setBusy(false); if (galleryInput.current) galleryInput.current.value = '' }
  }
  const moveGallery = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= galleryPreview.length) return
    const previews = [...galleryPreview]
    ;[previews[index], previews[target]] = [previews[target], previews[index]]
    setGalleryPreview(previews)
    setContent((current) => {
      const images = [...current.images]
      ;[images[index], images[target]] = [images[target], images[index]]
      return { ...current, images: images.map((image, order) => ({ ...image, order })) }
    })
    setDirty(true)
  }
  const removeGalleryImage = (index: number) => {
    setGalleryPreview((current) => current.filter((_, position) => position !== index))
    setContent((current) => ({ ...current, images: current.images.filter((_, position) => position !== index).map((image, order) => ({ ...image, order })) }))
    setDirty(true)
  }
  const preview = async () => {
    if (!id) { notify('Save the draft first to generate a private preview.'); return }
    try {
      const result = await projectUseCases.preview(id)
      setContent(normalizeProjectContent(result.data.content))
      notify('Private preview loaded.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load preview.') }
  }
  const textField = (label: string, field: keyof Content, multiline = false) => {
    const localizedValue = content[field] as Localized
    return <label className="field-label" key={field}>{label}{multiline ? <textarea rows={3} value={localizedValue?.[activeLanguage] || ''} onChange={(event) => updateLocalized(field, event.target.value)} /> : <input value={localizedValue?.[activeLanguage] || ''} onChange={(event) => updateLocalized(field, event.target.value)} />}</label>
  }
  const currentTitle = content.title[activeLanguage] || content.title.en || content.title.ar || 'Untitled project'
  return <>
    <div className="page-heading editor-page-heading"><div><a className="back-link" href="#/admin/projects"><ArrowLeft size={14} /> Projects</a><h1>{id ? 'Edit project' : 'New project'}</h1><p>Update project details and its public case study.</p></div><div className="heading-actions">{id && <button className="button-outline danger-outline" onClick={() => void deleteProject()} disabled={busy}>Delete</button>}<button className="button-outline" onClick={() => void saveDraft()} disabled={busy}>{busy ? 'Saving…' : 'Save draft'}</button><button className="button-dark" onClick={() => void publish()} disabled={busy}>Publish <ArrowUpRight size={14} /></button></div></div>
    <div className="editor-status"><span><i />{dirty ? 'UNSAVED CHANGES' : status.toUpperCase()}</span><span>{savedAt ? `Saved ${savedAt}` : id ? 'Saved draft loads from the server' : 'New project · not saved'}</span><button onClick={() => void preview()}><Eye size={14} /> Preview</button></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    <div className="editor-tabs" role="tablist">{tabs.map((item, i) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}><span>0{i + 1}</span>{item}{item === 'Translations' && <i className="tab-warning" />}</button>)}</div>
    {loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading project…</b></div> : <div className="editor-layout"><div className="editor-form">
      {tab === 'Basic information' && <><div className="form-section-title"><div><h2>Basic information</h2><p>The essentials visitors will see first.</p></div><button className="language-chip" onClick={() => setActiveLanguage(activeLanguage === 'en' ? 'ar' : 'en')}>{activeLanguage === 'en' ? 'ENGLISH' : 'العربية'} <ChevronDown size={13} /></button></div>{textField('Project title', 'title')}<label className="field-label">URL slug<input value={content.slug} onChange={(event) => { setContent((current) => ({ ...current, slug: event.target.value })); setDirty(true) }} /></label><div className="field-pair">{textField('Category', 'category')}<label className="field-label">Year<input type="number" value={content.year || ''} onChange={(event) => { setContent((current) => ({ ...current, year: event.target.value ? Number(event.target.value) : undefined })); setDirty(true) }} /></label></div>{textField('Short description', 'summary', true)}<div className="field-label">Cover image<input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void uploadCover(event.target.files?.[0])} /><div className="cover-upload">{media?.secureUrl ? <img className="uploaded-cover" src={media.secureUrl} alt="Project cover preview" /> : <div className="upload-preview fieldnotes"><Image size={20} /></div>}<div><b>{media ? 'Uploaded image' : 'No cover image selected'}</b><small>JPEG, PNG, WebP, AVIF · 10 MB maximum</small><button className="text-button" onClick={() => fileInput.current?.click()} disabled={busy}>Choose image</button></div></div></div><label className="field-label">Technologies<input value={content.technologies.join(', ')} onChange={(event) => { setContent((current) => ({ ...current, technologies: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })); setDirty(true) }} placeholder="Flutter, Node.js" /></label></>}
      {tab === 'Gallery' && <><div className="form-section-title"><div><h2>Project gallery</h2><p>Upload and reorder images included in this case study.</p></div><input ref={galleryInput} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void uploadGallery(event.target.files)} /><button className="button-outline" onClick={() => galleryInput.current?.click()} disabled={busy}><Plus size={14}/> Add images</button></div>{galleryPreview.length ? <div className="project-gallery-editor">{galleryPreview.map((image,index)=><div className="project-gallery-item" key={image.id}><img src={image.secureUrl} alt={`Project gallery image ${index+1}`} /><span>{String(index+1).padStart(2,'0')}</span><div><button className="icon-btn" onClick={()=>moveGallery(index,-1)} disabled={index===0} aria-label="Move image left"><ArrowLeft size={14}/></button><button className="icon-btn" onClick={()=>moveGallery(index,1)} disabled={index===galleryPreview.length-1} aria-label="Move image right"><ArrowRight size={14}/></button><button className="icon-btn" onClick={()=>removeGalleryImage(index)} aria-label="Remove image"><X size={14}/></button></div></div>)}</div> : <div className="empty-state"><b>No gallery images</b><span>Add images to create a visual case study.</span></div>}</>}
      {tab === 'Case study' && <><div className="form-section-title"><div><h2>Case study</h2><p>Use documented details only. Unfilled sections stay private.</p></div><button className="language-chip" onClick={() => setActiveLanguage(activeLanguage === 'en' ? 'ar' : 'en')}>{activeLanguage === 'en' ? 'ENGLISH' : 'العربية'} <ChevronDown size={13} /></button></div>{textField('Project description', 'description', true)}{textField('Problem', 'problem', true)}{textField('Proposed solution', 'solution', true)}{textField('My role', 'role', true)}{textField('Technical challenges', 'challenges', true)}{textField('Technical decisions', 'decisions', true)}{textField('Implementation details', 'implementation', true)}{textField('Actual outcomes', 'results', true)}</>}
      {tab === 'Translations' && <><div className="form-section-title"><div><h2>Translations</h2><p>English and Arabic are saved as separate fields.</p></div></div>{(['en', 'ar'] as const).map((lang) => { const complete = Boolean(content.title[lang] && content.summary[lang]); return <div className={`translation-card ${complete ? '' : 'is-incomplete'}`} key={lang}><div><span className={`language-chip ${lang === 'ar' ? 'arabic' : ''}`}>{lang === 'en' ? 'EN' : 'ع'}</span><b>{lang === 'en' ? 'English' : 'Arabic'}</b><span className={complete ? 'translation-complete' : 'translation-incomplete'}>{complete ? 'Title & summary added' : 'Needs content'}</span></div><p>Title, summary, category, and case study fields.</p><button className="button-outline" onClick={() => setActiveLanguage(lang)}>Edit {lang === 'en' ? 'English' : 'Arabic'}</button></div> })}</>}
      {tab === 'Publishing & SEO' && <><div className="form-section-title"><div><h2>Publishing & SEO</h2><p>Draft changes remain private until published.</p></div></div><label className="field-label">Publication status<select value={status} onChange={(event) => setStatus(event.target.value === 'published' || event.target.value === 'archived' ? event.target.value : 'draft')}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><div className="switch-row"><div><b>Featured project</b><small>Show this project in the homepage selection.</small></div><button className={`switch ${featured ? 'is-on' : ''}`} onClick={() => { setFeatured(!featured); setDirty(true) }} aria-label="Toggle featured"><i /></button></div><label className="field-label">Display order<input type="number" value={order} onChange={(event) => { setOrder(Number(event.target.value)); setDirty(true) }} /></label><label className="field-label">SEO title<input value={content.seo.title[activeLanguage]} onChange={(event) => { setContent((current) => ({ ...current, seo: { ...current.seo, title: { ...current.seo.title, [activeLanguage]: event.target.value } } })); setDirty(true) }} /></label><label className="field-label">SEO description<textarea rows={3} value={content.seo.description[activeLanguage]} onChange={(event) => { setContent((current) => ({ ...current, seo: { ...current.seo, description: { ...current.seo.description, [activeLanguage]: event.target.value } } })); setDirty(true) }} /></label><p className="field-help">Status, featured state and ordering are saved when you publish.</p></>}
      <div className="form-bottom"><span>{error || (dirty ? 'Unsaved changes' : 'Changes are saved to the CMS when you save.')}</span><button className="button-dark" onClick={() => void saveDraft()} disabled={busy}>{busy ? 'Saving…' : 'Save draft'}</button></div>
    </div><aside className="editor-preview"><div className="preview-heading"><span>PRIVATE PREVIEW</span><button className="icon-btn" onClick={() => void preview()} aria-label="Refresh preview"><ArrowUpRight size={15} /></button></div><div className="preview-window"><div className="preview-browser"><i /><i /><i /><span>yasseralsleman.com / work / {content.slug || 'project'}</span></div><div className="preview-body"><small>SELECTED WORK · {content.category[activeLanguage] || 'PROJECT'}</small><h3>{currentTitle}</h3><p>{content.summary[activeLanguage] || content.summary.en || 'Your project summary will appear here.'}</p>{media?.secureUrl && <img className="preview-cover" src={media.secureUrl} alt="" />}<div className="preview-tags">{content.technologies.join(' · ') || 'TECHNOLOGIES'}</div></div></div><p className="preview-note"><ShieldCheck size={14} /> Draft previews require your administrator session.</p></aside></div>}
  </>
}

function ProfilePage({ availability, setAvailability, notify }: { availability: boolean | null; setAvailability: (value: boolean) => void; notify: (message: string) => void }) {
  type Localized = { en: string; ar: string }
  type Profile = {
    name: Localized; title: Localized; introduction: Localized; biography: Localized
    email: string; location: Localized; socials: Record<string, string>; profileImage?: string | null
  }
  const [profile, setProfile] = useState<Profile>({
    name: { en: '', ar: '' }, title: { en: '', ar: '' }, introduction: { en: '', ar: '' },
    biography: { en: '', ar: '' }, email: '', location: { en: '', ar: '' }, socials: {},
  })
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const imageInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    apiRequest<{ data: (Omit<Profile, 'profileImage'> & { availability?: boolean; profileImage?: { _id: string; secureUrl: string } | string | null }) | null }>('/admin/profile')
      .then(({ data }) => {
        if (!active || !data) return
        const image = data.profileImage
        setProfileImageUrl(image && typeof image === 'object' ? image.secureUrl : '')
        setProfile({
          name: data.name || { en: '', ar: '' }, title: data.title || { en: '', ar: '' },
          introduction: data.introduction || { en: '', ar: '' }, biography: data.biography || { en: '', ar: '' },
          email: data.email || '', location: data.location || { en: '', ar: '' }, socials: data.socials || {},
          profileImage: image && typeof image === 'object' ? image._id : typeof image === 'string' ? image : null,
        })
        if (typeof data.availability === 'boolean') setAvailability(data.availability)
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load profile.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [setAvailability])

  const updateLocalized = (field: 'name' | 'title' | 'introduction' | 'biography' | 'location', value: string) => {
    setProfile((current) => ({ ...current, [field]: { ...current[field], [lang]: value } }))
  }
  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await apiRequest('/admin/profile', { method: 'PUT', body: JSON.stringify({ ...profile, availability }) })
      notify('Profile saved.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save profile.')
    } finally { setSaving(false) }
  }
  const upload = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, WebP, or AVIF image under 10 MB.')
      return
    }
    try {
      const body = new FormData()
      body.append('file', file)
      const result = await apiRequest<{ data: { _id: string; secureUrl: string } }>('/admin/media', { method: 'POST', body })
      setProfile((current) => ({ ...current, profileImage: result.data._id }))
      setProfileImageUrl(result.data.secureUrl)
      notify('Image uploaded. Save the profile to apply it.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Image upload failed.') }
    finally { if (imageInput.current) imageInput.current.value = '' }
  }
  return <>
    <div className="page-heading"><div><div className="overline">CONTENT / PROFILE</div><h1>Profile</h1><p>Shape how people get to know you across the website.</p></div><button className="button-dark" onClick={() => void save()} disabled={saving}><Check size={15} /> {saving ? 'Saving…' : 'Save changes'}</button></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    {loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading profile…</b></div> : <div className="profile-layout"><div className="profile-form panel">
      <div className="form-section-title"><div><h2>Personal details</h2><p>Visible across your public portfolio.</p></div><button className="language-chip" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{lang === 'en' ? 'ENGLISH' : 'العربية'} <ChevronDown size={13} /></button></div>
      <label className="field-label">Full name<input value={profile.name[lang]} onChange={(event) => updateLocalized('name', event.target.value)} /></label>
      <label className="field-label">Professional title<input value={profile.title[lang]} onChange={(event) => updateLocalized('title', event.target.value)} /></label>
      <div className="field-label">Profile image<input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void upload(event.target.files?.[0])} /><div className="profile-image-upload">{profileImageUrl ? <img className="profile-uploaded-image" src={profileImageUrl} alt="Uploaded profile portrait"/> : <div className="profile-monogram">YA</div>}<div><b>{profile.profileImage ? 'Portrait uploaded' : 'No profile photo added'}</b><small>Use a real portrait. JPEG, PNG, WebP or AVIF up to 10 MB.</small><button className="text-button" onClick={() => imageInput.current?.click()}>Upload portrait</button></div></div></div>
      <label className="field-label">Short introduction<textarea rows={3} value={profile.introduction[lang]} onChange={(event) => updateLocalized('introduction', event.target.value)} /></label>
      <label className="field-label">Biography<textarea rows={5} value={profile.biography[lang]} onChange={(event) => updateLocalized('biography', event.target.value)} /></label>
      <div className="field-pair"><label className="field-label">Email<input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></label><label className="field-label">Location<input value={profile.location[lang]} onChange={(event) => updateLocalized('location', event.target.value)} /></label></div>
      <div className="form-section-title social-title"><div><h2>Social links</h2><p>Only add profiles you actively use.</p></div></div>
      {['LinkedIn', 'GitHub'].map((social) => <label className="field-label" key={social}>{social}<input value={profile.socials[social.toLowerCase()] || ''} placeholder={`https://${social.toLowerCase()}.com/…`} onChange={(event) => setProfile((current) => ({ ...current, socials: { ...current.socials, [social.toLowerCase()]: event.target.value } }))} /></label>)}
    </div><aside className="profile-side"><div className="panel availability-panel"><span className="panel-eyebrow">WORK STATUS</span><h3>Project availability</h3><p>Control the availability indicator shown on your homepage.</p><div className="switch-row"><div><b>{availability === true ? 'Available' : availability === false ? 'Unavailable' : 'Not set'}</b><small>Public status</small></div><button className={`switch ${availability === true ? 'is-on' : ''}`} onClick={() => setAvailability(availability !== true)} aria-label="Toggle project availability"><i /></button></div></div><div className="panel language-panel"><span className="panel-eyebrow">LOCALIZED CONTENT</span><h3>Languages</h3>{(['en', 'ar'] as const).map((current) => { const complete = Boolean(profile.name[current] && profile.introduction[current]); return <div key={current}><span className={`language-chip ${current === 'ar' ? 'arabic' : ''}`}>{current === 'en' ? 'EN' : 'ع'}</span><b>{current === 'en' ? 'English' : 'Arabic'}</b><span className={complete ? 'translation-complete' : 'translation-incomplete'}>{complete ? 'Complete' : 'Needs content'}</span></div> })}<button className="tiny-link" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>Edit another language <ArrowRight size={13} /></button></div></aside></div>}
  </>
}

function MessagesPage({ notify }: { notify: (message: string) => void }) {
  type Inquiry = { _id: string; inquiryId: string; name: string; email: string; subject: string; message: string; status: 'new' | 'in-progress' | 'replied' | 'archived'; internalNotes: string; createdAt: string }
  const [messages, setMessages] = useState<Inquiry[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const message = messages.find((item) => item._id === selectedId)
  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    if (filter) params.set('status', filter)
    apiRequest<{ data: Inquiry[] }>(`/admin/inquiries?${params}`)
      .then(({ data }) => {
        setMessages(data)
        const selected = data.find((item) => item._id === selectedId) || data[0]
        setSelectedId(selected?._id || '')
        setNotes(selected?.internalNotes || '')
        setError('')
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load inquiries.'))
      .finally(() => setLoading(false))
  }, [filter, query, selectedId])
  useEffect(() => {
    const timer = window.setTimeout(load, 250)
    return () => window.clearTimeout(timer)
  }, [load])
  const update = async (changes: Partial<Pick<Inquiry, 'status' | 'internalNotes'>>) => {
    if (!message) return
    try {
      const { data } = await apiRequest<{ data: Inquiry }>(`/admin/inquiries/${message._id}`, { method: 'PATCH', body: JSON.stringify(changes) })
      setMessages((items) => items.map((item) => item._id === data._id ? data : item))
      setNotes(data.internalNotes)
      notify('Inquiry updated.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update inquiry.') }
  }
  const remove = async () => {
    if (!message || !window.confirm('Delete this inquiry permanently?')) return
    try {
      await apiRequest(`/admin/inquiries/${message._id}`, { method: 'DELETE' })
      setSelectedId('')
      load()
      notify('Inquiry deleted.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete inquiry.') }
  }
  return <>
    <div className="page-heading"><div><div className="overline">COMMUNICATION / INBOX</div><h1>Messages <span className="heading-count">{messages.filter((item) => item.status === 'new').length}</span></h1><p>Review and manage contact form inquiries.</p></div><button className="button-outline" onClick={load} disabled={loading}>Refresh <ArrowRight size={14} /></button></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    <div className="inbox-layout"><div className="inbox-list"><div className="inbox-tools"><div className="search-field"><Search size={15} /><input placeholder="Search messages…" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="filter-button" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter inquiries"><option value="">All messages</option><option value="new">New</option><option value="in-progress">In progress</option><option value="replied">Replied</option><option value="archived">Archived</option></select></div>{loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading inquiries…</b></div> : messages.length ? messages.map((item) => <button className={`inbox-item ${selectedId === item._id ? 'selected' : ''} ${item.status === 'new' ? 'unread' : ''}`} key={item._id} onClick={() => { setSelectedId(item._id); setNotes(item.internalNotes) }}><span className="avatar">{item.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="inbox-summary"><b>{item.name}</b><small>{item.subject || item.email}</small><span>{item.message.slice(0, 60)}…</span></span><time>{new Date(item.createdAt).toLocaleDateString()}</time></button>) : <div className="empty-state"><b>No inquiries found</b><span>New contact form submissions will appear here.</span></div>}</div>{message ? <article className="message-detail"><div className="message-detail-head"><div><span className="panel-eyebrow">INQUIRY · {message.inquiryId}</span><h2>{message.subject || 'Website inquiry'}</h2></div><button className="icon-btn" onClick={() => void remove()} aria-label="Delete inquiry"><X size={16} /></button></div><div className="sender-row"><span className="avatar">{message.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div><b>{message.name}</b><small>{message.email}</small></div><time>{new Date(message.createdAt).toLocaleString()}</time></div><div className="message-body">{message.message}</div><label className="field-label">Internal notes<textarea rows={4} maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><div className="message-detail-actions"><a className="button-dark" href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject || 'Website inquiry'}`)}`}>Reply by email <ArrowUpRight size={14} /></a><select value={message.status} onChange={(event) => void update({ status: event.target.value as Inquiry['status'] })} aria-label="Inquiry status"><option value="new">New</option><option value="in-progress">In progress</option><option value="replied">Replied</option><option value="archived">Archived</option></select><button className="button-outline" onClick={() => void update({ internalNotes: notes })}>Save notes</button></div></article> : <div className="message-detail empty-state">{loading ? 'Loading inquiry…' : 'Select an inquiry to read its details.'}</div>}</div>
  </>
}

function SubpageHeading({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="page-heading"><div><div className="overline">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><button className="button-dark" onClick={onAction}><Plus size={15} />{action}</button></div>
}

function ServicesManager({ notify }: { notify: (message: string) => void }) {
  type ServiceItem = { _id: string; title: { en?: string; ar?: string }; description: { en?: string; ar?: string }; technologies: string[]; status: 'draft' | 'published' | 'archived'; order: number; icon: string; image?: string | { _id: string; secureUrl: string } | null }
  const [services, setServices] = useState<ServiceItem[]>([])
  const [editing, setEditing] = useState<ServiceItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [status, setStatus] = useState<ServiceItem['status']>('draft')
  const [imageId, setImageId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const imageInput = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    apiRequest<{ data: ServiceItem[] }>('/admin/services').then(({ data }) => setServices(data))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load services.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])
  const begin = (item?: ServiceItem) => {
    setFormOpen(true)
    setEditing(item || null)
    setTitleEn(item?.title.en || '')
    setTitleAr(item?.title.ar || '')
    setDescriptionEn(item?.description.en || '')
    setDescriptionAr(item?.description.ar || '')
    setTechnologies(item?.technologies.join(', ') || '')
    setStatus(item?.status || 'draft')
    setImageId(item?.image && typeof item.image === 'object' ? item.image._id : typeof item?.image === 'string' ? item.image : null)
    setImageUrl(item?.image && typeof item.image === 'object' ? item.image.secureUrl : '')
    setError('')
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = JSON.stringify({
        title: { en: titleEn, ar: titleAr },
        description: { en: descriptionEn, ar: descriptionAr },
        technologies: technologies.split(',').map((item) => item.trim()).filter(Boolean),
        status, order: editing?.order ?? services.length, icon: 'Code2', image: imageId,
      })
      await apiRequest(editing ? `/admin/services/${editing._id}` : '/admin/services', { method: editing ? 'PUT' : 'POST', body })
      setEditing(null)
      setFormOpen(false)
      load()
      notify(editing ? 'Service saved.' : 'Service created.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this service.') }
    finally { setBusy(false) }
  }
  const remove = async (item: ServiceItem) => {
    if (!window.confirm(`Delete “${item.title.en || item.title.ar || 'this service'}”?`)) return
    try {
      await apiRequest(`/admin/services/${item._id}`, { method: 'DELETE' })
      if (editing?._id === item._id) { setEditing(null); setFormOpen(false) }
      load()
      notify('Service deleted.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete service.') }
  }
  const move = async (item: ServiceItem, direction: -1 | 1) => {
    const index = services.findIndex((service) => service._id === item._id)
    const next = [...services]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setServices(next)
    try { await apiRequest('/admin/services/order', { method: 'PUT', body: JSON.stringify({ ids: next.map((service) => service._id) }) }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not reorder services.'); load() }
  }
  const uploadImage = async (file?:File) => {
    if(!file)return
    if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>10*1024*1024){setError('Choose a supported image under 10 MB.');return}
    const body=new FormData();body.append('file',file)
    try{const {data}=await apiRequest<{data:{_id:string;secureUrl:string}}>('/admin/media',{method:'POST',body});setImageId(data._id);setImageUrl(data.secureUrl);notify('Service image uploaded. Save the service to apply it.')}
    catch(reason){setError(reason instanceof Error?reason.message:'Service image upload failed.')}
    finally{if(imageInput.current)imageInput.current.value=''}
  }
  return <>
    <SubpageHeading eyebrow="CONTENT / SERVICES" title="Services" description="Manage published offerings and their English and Arabic content." action="Add service" onAction={() => begin()} />
    {error && <div className="request-error" role="alert">{error}</div>}
    {formOpen && <form className="panel profile-form" onSubmit={(event) => void save(event)}><div className="form-section-title"><div><h2>{editing ? 'Edit service' : 'New service'}</h2><p>Translations are stored independently for each language.</p></div><button type="button" className="icon-btn" onClick={() => setFormOpen(false)} aria-label="Close service editor"><X size={17} /></button></div><div className="field-pair"><label className="field-label">Title · English<input required maxLength={180} value={titleEn} onChange={(event) => setTitleEn(event.target.value)} /></label><label className="field-label">العنوان · العربية<input maxLength={180} dir="rtl" value={titleAr} onChange={(event) => setTitleAr(event.target.value)} /></label></div><div className="field-pair"><label className="field-label">Description · English<textarea rows={3} maxLength={5000} value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} /></label><label className="field-label">الوصف · العربية<textarea rows={3} maxLength={5000} dir="rtl" value={descriptionAr} onChange={(event) => setDescriptionAr(event.target.value)} /></label></div><label className="field-label">Technologies, comma separated<input value={technologies} onChange={(event) => setTechnologies(event.target.value)} /></label><label className="field-label">Service image<input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event)=>void uploadImage(event.target.files?.[0])}/>{imageUrl&&<img className="settings-logo-preview" src={imageUrl} alt="Service preview"/>}</label><label className="field-label">Publication status<select value={status} onChange={(event) => setStatus(event.target.value as ServiceItem['status'])}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><button className="button-dark" disabled={busy}>{busy ? 'Saving…' : 'Save service'}</button></form>}
    <section className="panel content-list"><div className="list-toolbar"><span>{services.length} SERVICES</span><button className="button-outline" onClick={() => { setLoading(true); load() }} disabled={loading}>Refresh</button></div>{loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading services…</b></div> : services.length ? services.map((item, index) => <div className="content-list-row" key={item._id}><span className="list-index">{String(index + 1).padStart(2, '0')}</span><span className="service-symbol"><Code2 size={17} /></span><div className="content-list-main"><b>{item.title.en || item.title.ar || 'Untitled service'}</b><small>{item.title.ar || 'Arabic translation not added'}</small></div><span className="list-stack">{item.technologies.join(' · ')}</span><StatusBadge status={item.status === 'published' ? 'Published' : item.status === 'archived' ? 'Archived' : 'Draft'} /><button className="icon-btn" onClick={() => move(item, -1)} disabled={index === 0} aria-label="Move service up"><ArrowUpRight size={15} /></button><button className="icon-btn" onClick={() => begin(item)} aria-label={`Edit ${item.title.en || 'service'}`}><MoreHorizontal size={17} /></button><button className="icon-btn" onClick={() => void remove(item)} aria-label={`Delete ${item.title.en || 'service'}`}><X size={15} /></button></div>) : <div className="empty-state"><b>No services yet</b><span>Add a service to show it on the public website after publishing.</span></div>}</section>
  </>
}

function TestimonialsManager({ notify }: { notify: (message: string) => void }) {
  type Testimonial = { _id: string; author: { en?: string; ar?: string }; role: { en?: string; ar?: string }; quote: { en?: string; ar?: string }; enabled: boolean; order: number }
  const [items, setItems] = useState<Testimonial[]>([])
  const [selected, setSelected] = useState<Testimonial | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [authorEn, setAuthorEn] = useState('')
  const [authorAr, setAuthorAr] = useState('')
  const [roleEn, setRoleEn] = useState('')
  const [roleAr, setRoleAr] = useState('')
  const [quoteEn, setQuoteEn] = useState('')
  const [quoteAr, setQuoteAr] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    apiRequest<{ data: Testimonial[] }>('/admin/testimonials').then(({ data }) => setItems(data))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load testimonials.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])
  const edit = (item?: Testimonial) => {
    setEditorOpen(true)
    setSelected(item || null)
    setAuthorEn(item?.author.en || ''); setAuthorAr(item?.author.ar || '')
    setRoleEn(item?.role.en || ''); setRoleAr(item?.role.ar || '')
    setQuoteEn(item?.quote.en || ''); setQuoteAr(item?.quote.ar || '')
    setEnabled(item?.enabled || false)
    setError('')
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const body = JSON.stringify({ author: { en: authorEn, ar: authorAr }, role: { en: roleEn, ar: roleAr }, quote: { en: quoteEn, ar: quoteAr }, enabled, order: selected?.order ?? items.length })
      const result = await apiRequest<{ data: Testimonial }>(selected ? `/admin/testimonials/${selected._id}` : '/admin/testimonials', { method: selected ? 'PUT' : 'POST', body })
      edit(result.data)
      load()
      notify('Testimonial saved.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save testimonial.') }
  }
  const remove = async (item: Testimonial) => {
    if (!window.confirm('Delete this testimonial?')) return
    try { await apiRequest(`/admin/testimonials/${item._id}`, { method: 'DELETE' }); if (selected?._id === item._id) edit(); load(); notify('Testimonial deleted.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete testimonial.') }
  }
  return <>
    <div className="page-heading"><div><div className="overline">CONTENT / TESTIMONIALS</div><h1>Testimonials</h1><p>Only publish customer feedback that has been provided and approved.</p></div><button className="button-dark" onClick={() => edit()}><Plus size={15} /> Add testimonial</button></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    <section className="panel content-list"><div className="list-toolbar"><span>{items.length} CUSTOMER QUOTES</span><button className="button-outline" onClick={() => { setLoading(true); load() }} disabled={loading}>Refresh</button></div>{loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading testimonials…</b></div> : items.length ? items.map((item,index)=><div className="content-list-row" key={item._id}><span className="list-index">{String(index+1).padStart(2,'0')}</span><div className="content-list-main"><b>{item.author.en || item.author.ar || 'Unnamed author'}</b><small>{item.role.en || item.role.ar || 'Role not specified'} · {item.enabled?'Visible publicly':'Hidden'}</small><p>{item.quote.en || item.quote.ar}</p></div><button className="button-outline" onClick={() => edit(item)}>Edit</button><button className="icon-btn" onClick={() => void remove(item)} aria-label="Delete testimonial"><X size={15} /></button></div>) : <div className="empty-state"><b>No testimonials</b><span>Add only real, authorized customer quotes.</span></div>}</section>
    {editorOpen && <form className="panel profile-form" onSubmit={(event) => void save(event)}><div className="form-section-title"><div><h2>{selected?'Edit testimonial':'New testimonial'}</h2><p>No sample reviews are inserted.</p></div><button type="button" className="icon-btn" onClick={() => setEditorOpen(false)} aria-label="Close testimonial editor"><X size={16}/></button></div><div className="field-pair"><label className="field-label">Customer name · English<input value={authorEn} onChange={(event)=>setAuthorEn(event.target.value)} /></label><label className="field-label">اسم العميل · العربية<input dir="rtl" value={authorAr} onChange={(event)=>setAuthorAr(event.target.value)} /></label></div><div className="field-pair"><label className="field-label">Role · English<input value={roleEn} onChange={(event)=>setRoleEn(event.target.value)} /></label><label className="field-label">الصفة · العربية<input dir="rtl" value={roleAr} onChange={(event)=>setRoleAr(event.target.value)} /></label></div><div className="field-pair"><label className="field-label">Quote · English<textarea required rows={4} value={quoteEn} onChange={(event)=>setQuoteEn(event.target.value)} /></label><label className="field-label">النص · العربية<textarea rows={4} dir="rtl" value={quoteAr} onChange={(event)=>setQuoteAr(event.target.value)} /></label></div><label className="switch-row"><span><b>Visible on public website</b></span><button type="button" className={`switch ${enabled?'is-on':''}`} onClick={()=>setEnabled(!enabled)} aria-label="Toggle testimonial visibility"><i /></button></label><button className="button-dark">Save testimonial</button></form>}
  </>
}

function ArticlesManager({ notify }: { notify: (message: string) => void }) {
  type ArticleContent = { title: { en: string; ar: string }; slug: string; summary: { en: string; ar: string }; body: { en: string; ar: string }; category: { en: string; ar: string }; tags: string[]; cover?: string | null; seo?: { title?: { en?: string; ar?: string }; description?: { en?: string; ar?: string } } }
  type ArticleItem = { _id: string; content: ArticleContent; draft?: ArticleContent; status: 'draft' | 'published' | 'archived' | 'scheduled'; scheduledAt?: string; updatedAt: string }
  const blank = (): ArticleContent => ({ title: { en: '', ar: '' }, slug: '', summary: { en: '', ar: '' }, body: { en: '', ar: '' }, category: { en: '', ar: '' }, tags: [], seo: { title: { en: '', ar: '' }, description: { en: '', ar: '' } } })
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [content, setContent] = useState<ArticleContent>(blank)
  const [status, setStatus] = useState<ArticleItem['status']>('draft')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const coverInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    let active = true
    apiRequest<{ data: ArticleItem[] }>('/admin/articles')
      .then(({ data }) => {
        if (!active) return
      setArticles(data)
      const selected = data.find((item) => item._id === selectedId) || data[0]
      if (selected) {
        setSelectedId(selected._id)
        setContent(selected.draft || selected.content)
        setStatus(selected.status)
        setScheduledAt(selected.scheduledAt ? new Date(selected.scheduledAt).toISOString().slice(0, 16) : '')
      } else {
        setSelectedId('')
        setContent(blank())
        setStatus('draft')
        setScheduledAt('')
      }
      setError('')
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load articles.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selectedId, refreshKey])
  const reload = () => { setLoading(true); setRefreshKey((key) => key + 1) }
  const newArticle = () => { setSelectedId(''); setContent(blank()); setStatus('draft'); setScheduledAt(''); setError('') }
  const save = async () => {
    if (status === 'scheduled' && !scheduledAt) { setError('Choose a publication date and time for scheduled articles.'); return }
    setBusy(true)
    setError('')
    try {
      const contentToSave = { ...content, slug: content.slug || content.title.en.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
      const body = JSON.stringify({ content: contentToSave, status: status === 'published' ? 'draft' : status, scheduledAt: status === 'scheduled' ? new Date(scheduledAt).toISOString() : null })
      const result = await apiRequest<{ data: ArticleItem }>(selectedId ? `/admin/articles/${selectedId}` : '/admin/articles', { method: selectedId ? 'PUT' : 'POST', body })
      setSelectedId(result.data._id)
      setStatus(result.data.status)
      reload()
      notify('Article draft saved.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save article.') }
    finally { setBusy(false) }
  }
  const publish = async () => {
    if (!selectedId) { setError('Save this article before publishing.'); return }
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/admin/articles/${selectedId}/publish`, { method: 'POST', body: '{}' })
      reload()
      notify('Article published.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not publish article.') }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!selectedId || !window.confirm('Delete this article permanently?')) return
    try {
      await apiRequest(`/admin/articles/${selectedId}`, { method: 'DELETE' })
      notify('Article deleted.')
      newArticle()
      reload()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete article.') }
  }
  const uploadCover = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) { setError('Choose a supported image under 10 MB.'); return }
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await apiRequest<{ data: { _id: string } }>('/admin/media', { method: 'POST', body: formData })
      setContent((current) => ({ ...current, cover: data._id }))
      notify('Featured image uploaded. Save the article to apply it.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Image upload failed.') }
    finally { if (coverInput.current) coverInput.current.value = '' }
  }
  return <>
    <div className="page-heading"><div><div className="overline">CONTENT / JOURNAL</div><h1>Articles</h1><p>Create, translate, schedule, and publish your writing.</p></div><button className="button-dark" onClick={newArticle}><Plus size={15} /> New article</button></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    <div className="article-workspace"><aside className="article-list panel"><div className="list-toolbar"><span>{articles.length} ARTICLES</span><button className="button-outline" onClick={reload} disabled={loading}>Refresh</button></div>{loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading articles…</b></div> : articles.length ? articles.map((item) => <button key={item._id} className={`article-list-item ${selectedId === item._id ? 'selected' : ''}`} onClick={() => { setSelectedId(item._id); setContent(item.draft || item.content); setStatus(item.status); setScheduledAt(item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '') }}><span className="article-list-date">{new Date(item.updatedAt).toLocaleDateString()}</span><b>{item.draft?.title?.en || item.content.title.en || item.content.title.ar || 'Untitled article'}</b><small>{item.status} · {item.content.title.ar ? 'EN / AR' : 'Translation needed'}</small></button>) : <div className="empty-state"><b>No articles yet</b><span>Create your first article.</span></div>}</aside><section className="article-editor panel"><div className="article-editor-head"><div><span className="panel-eyebrow">ARTICLE EDITOR</span><h2>{content.title.en || content.title.ar || 'Untitled article'}</h2></div><div className="heading-actions"><select aria-label="Article status" value={status} onChange={(event) => setStatus(event.target.value as ArticleItem['status'])}><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select>{selectedId && <button className="icon-btn" onClick={() => void remove()} aria-label="Delete article"><X size={15} /></button>}</div></div><div className="field-pair"><label className="field-label">Title · English<input value={content.title.en} onChange={(event) => setContent((current) => ({ ...current, title: { ...current.title, en: event.target.value } }))} /></label><label className="field-label">العنوان · العربية<input dir="rtl" value={content.title.ar} onChange={(event) => setContent((current) => ({ ...current, title: { ...current.title, ar: event.target.value } }))} /></label></div><label className="field-label">SEO-friendly slug<input value={content.slug} onChange={(event) => setContent((current) => ({ ...current, slug: event.target.value }))} placeholder="article-url-slug" /></label>{status === 'scheduled' && <label className="field-label">Publish date and time<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>}<div className="field-pair"><label className="field-label">Category · English<input value={content.category.en} onChange={(event) => setContent((current) => ({ ...current, category: { ...current.category, en: event.target.value } }))} /></label><label className="field-label">Category · Arabic<input dir="rtl" value={content.category.ar} onChange={(event) => setContent((current) => ({ ...current, category: { ...current.category, ar: event.target.value } }))} /></label></div><div className="field-pair"><label className="field-label">Summary · English<textarea rows={2} value={content.summary.en} onChange={(event) => setContent((current) => ({ ...current, summary: { ...current.summary, en: event.target.value } }))} /></label><label className="field-label">الملخص · العربية<textarea rows={2} dir="rtl" value={content.summary.ar} onChange={(event) => setContent((current) => ({ ...current, summary: { ...current.summary, ar: event.target.value } }))} /></label></div><div className="field-pair"><label className="field-label">Article · English<textarea className="article-body-input" rows={8} value={content.body.en} onChange={(event) => setContent((current) => ({ ...current, body: { ...current.body, en: event.target.value } }))} /></label><label className="field-label">المقال · العربية<textarea className="article-body-input" rows={8} dir="rtl" value={content.body.ar} onChange={(event) => setContent((current) => ({ ...current, body: { ...current.body, ar: event.target.value } }))} /></label></div><div className="field-pair"><label className="field-label">SEO title · English<input maxLength={70} value={content.seo?.title?.en||''} onChange={(event)=>setContent((current)=>({...current,seo:{...current.seo,title:{...current.seo?.title,en:event.target.value}}}))}/></label><label className="field-label">عنوان SEO · العربية<input dir="rtl" maxLength={70} value={content.seo?.title?.ar||''} onChange={(event)=>setContent((current)=>({...current,seo:{...current.seo,title:{...current.seo?.title,ar:event.target.value}}}))}/></label></div><div className="field-pair"><label className="field-label">Meta description · English<textarea rows={2} maxLength={180} value={content.seo?.description?.en||''} onChange={(event)=>setContent((current)=>({...current,seo:{...current.seo,description:{...current.seo?.description,en:event.target.value}}}))}/></label><label className="field-label">الوصف التعريفي · العربية<textarea dir="rtl" rows={2} maxLength={180} value={content.seo?.description?.ar||''} onChange={(event)=>setContent((current)=>({...current,seo:{...current.seo,description:{...current.seo?.description,ar:event.target.value}}}))}/></label></div><label className="field-label">Tags, comma separated<input value={content.tags.join(', ')} onChange={(event) => setContent((current) => ({ ...current, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))} /></label><label className="field-label">Featured image<input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => void uploadCover(event.target.files?.[0])} /></label><div className="article-editor-footer"><span>{status.toUpperCase()} · Changes save to the CMS database.</span><div className="heading-actions"><button className="button-outline danger-outline" onClick={() => void remove()} disabled={!selectedId}>Delete</button><button className="button-outline" onClick={() => void save()} disabled={busy}>{busy ? 'Saving…' : 'Save draft'}</button><button className="button-dark" onClick={() => void publish()} disabled={busy || !selectedId}>Publish</button></div></div></section></div>
  </>
}

function SectionsManager({ notify }: { notify: (message: string) => void }) {
  type Section = { _id?: string; key: string; title: { en?: string; ar?: string }; content: { en?: string; ar?: string }; enabled: boolean; order: number }
  const [sections, setSections] = useState<Section[]>([])
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    apiRequest<{ data: Section[] }>('/admin/pages').then(({ data }) => setSections(data.length ? data : ['hero','about','services','projects','articles','testimonials','approach','contact','footer'].map((key, order) => ({ key, title: { en: '', ar: '' }, content: { en: '', ar: '' }, enabled: true, order }))))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load homepage sections.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSections(next.map((section, order) => ({ ...section, order })))
  }
  const updateSection = (index: number, changes: Partial<Section>) => setSections((items) => items.map((item, current) => current === index ? { ...item, ...changes } : item))
  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const { data } = await apiRequest<{ data: Section[] }>('/admin/pages', { method: 'PUT', body: JSON.stringify({ sections: sections.map(({ key, title, content, enabled }, order) => ({ key, title, content, enabled, order })) }) })
      setSections(data)
      notify('Homepage sections saved.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save homepage sections.') }
    finally { setSaving(false) }
  }
  return <>
    <div className="page-heading"><div><div className="overline">CONTENT / STRUCTURE</div><h1>Pages & sections</h1><p>Edit structured homepage sections, their translations, visibility, and order.</p></div><div className="heading-actions"><a className="button-outline" href="#/" target="_blank" rel="noreferrer">Preview website <ArrowUpRight size={14} /></a><button className="button-dark" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save changes'} <Check size={14} /></button></div></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    <section className="panel section-manager"><div className="section-manager-head"><div><span className="panel-eyebrow">HOMEPAGE</span><h2>Section order & content</h2><p>Only enabled sections are returned by the public content API.</p></div><button className="language-chip" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>{language === 'en' ? 'ENGLISH' : 'العربية'} <ChevronDown size={13} /></button></div>{loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading sections…</b></div> : sections.length ? sections.map((section,index)=><div className={`section-manager-row ${section.enabled?'':'is-disabled'}`} key={section.key}><span className="list-index">{String(index+1).padStart(2,'0')}</span><Grid2X2 size={16} /><div className="content-list-main"><b>{section.title[language] || section.title.en || section.key}</b><input aria-label={`${section.key} section title`} value={section.title[language] || ''} dir={language==='ar'?'rtl':'ltr'} placeholder={language==='en'?'Section title':'عنوان القسم'} onChange={(event)=>updateSection(index,{title:{...section.title,[language]:event.target.value}})} /><textarea aria-label={`${section.key} section content`} rows={2} value={section.content[language] || ''} dir={language==='ar'?'rtl':'ltr'} placeholder={language==='en'?'Section content':'محتوى القسم'} onChange={(event)=>updateSection(index,{content:{...section.content,[language]:event.target.value}})} /></div><div className="reorder-buttons"><button onClick={()=>move(index,-1)} aria-label={`Move ${section.key} up`} disabled={index===0}><ArrowUpRight size={14} /></button><button onClick={()=>move(index,1)} aria-label={`Move ${section.key} down`} disabled={index===sections.length-1}><ArrowDown size={14} /></button></div><button className={`switch ${section.enabled?'is-on':''}`} onClick={()=>updateSection(index,{enabled:!section.enabled})} aria-label={`${section.enabled?'Hide':'Show'} ${section.key}`}><i /></button></div>) : <div className="empty-state"><b>No sections configured</b><span>The homepage is still rendered from its built-in structure until sections are created.</span></div>}</section>
  </>
}

function MediaManager({ notify }: { notify: (message: string) => void }) {
  type MediaItem = { _id: string; secureUrl: string; originalName: string; width: number; height: number; bytes: number; format: string; createdAt: string }
  const [assets, setAssets] = useState<MediaItem[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const load = useCallback(() => {
    apiRequest<{ data: MediaItem[] }>('/admin/media?limit=100').then(({ data }) => setAssets(data))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load media library.'))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])
  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error(`${file.name}: choose JPEG, PNG, WebP or AVIF under 10 MB.`)
        const body = new FormData()
        body.append('file', file)
        await apiRequest('/admin/media', { method: 'POST', body })
      }
      notify(`${files.length} image${files.length === 1 ? '' : 's'} uploaded.`)
      load()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Media upload failed.') }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = '' }
  }
  const remove = async (item: MediaItem) => {
    if (!window.confirm(`Delete “${item.originalName}”?`)) return
    try {
      await apiRequest(`/admin/media/${item._id}`, { method: 'DELETE' })
      setAssets((current) => current.filter((asset) => asset._id !== item._id))
      notify('Image deleted.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete image.') }
  }
  const copyUrl = async (url: string) => {
    if (!navigator.clipboard) { setError('Clipboard access is unavailable in this browser context.'); return }
    try { await navigator.clipboard.writeText(url); notify('Image URL copied.') }
    catch { setError('Could not access the clipboard.') }
  }
  const visibleAssets = assets.filter((asset) => asset.originalName.toLowerCase().includes(query.toLowerCase()))
  return <>
    <div className="page-heading"><div><div className="overline">LIBRARY / ASSETS</div><h1>Media library</h1><p>Uploaded images are optimized and stored securely.</p></div><div><input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(event) => void upload(event.target.files)} /><button className="button-dark" onClick={() => inputRef.current?.click()} disabled={uploading}><Plus size={15} />{uploading ? 'Uploading…' : 'Upload images'}</button></div></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    {uploading && <div className="upload-progress" role="status">Uploading and optimizing images. Please keep this page open…</div>}
    <div className="media-toolbar"><div className="search-field"><Search size={15}/><input placeholder="Search media…" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="button-outline" onClick={() => { setLoading(true); load() }} disabled={loading}>Refresh</button><span>{assets.length} stored images</span></div>
    {loading ? <div className="empty-state"><span className="loading-spinner" /><b>Loading media…</b></div> : visibleAssets.length ? <div className="media-grid">{visibleAssets.map((item)=><article className="media-card" key={item._id}><div className="media-thumb"><img src={item.secureUrl} alt={item.originalName} loading="lazy" /></div><div className="media-meta"><b>{item.originalName}</b><small>{item.width} × {item.height} · {(item.bytes / 1024).toFixed(0)} KB · {item.format.toUpperCase()}</small><button className="text-button" onClick={() => void copyUrl(item.secureUrl)}>Copy URL</button><button className="text-button danger-text" onClick={() => void remove(item)}>Delete image</button></div></article>)}</div> : <div className="empty-state"><b>No media found</b><span>Upload an image to add it to the library.</span></div>}
  </>
}

function AnalyticsPage() {
  type Analytics = { days: number; totalVisits: number; daily: Array<{ _id: string; visits: number }>; topPages: Array<{ _id: string; visits: number }> }
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    apiRequest<{ data: Analytics }>(`/admin/analytics?days=${days}`)
      .then(({ data: result }) => setData(result))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load analytics.'))
      .finally(() => setLoading(false))
  }, [days])
  useEffect(() => { load() }, [load])
  const maximum = Math.max(1, ...(data?.daily.map((item) => item.visits) || []))
  return <>
    <div className="page-heading"><div><div className="overline">INSIGHTS / PRIVACY-FIRST</div><h1>Analytics</h1><p>Daily page totals only; no IP address, account, or visitor profile is stored.</p></div><select className="filter-button" value={days} onChange={(event) => { setLoading(true); setDays(Number(event.target.value)) }} aria-label="Analytics date range"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    {loading && !data ? <div className="empty-state"><span className="loading-spinner" /><b>Loading analytics…</b></div> : data && <>
      <div className="stats-row"><Stat label="Page views" value={data.totalVisits.toLocaleString()} note={`Last ${data.days} days`} trend="" /><Stat label="Tracked routes" value={String(data.topPages.length).padStart(2, '0')} note="Unique page paths" trend="" /><Stat label="Daily average" value={(data.totalVisits / Math.max(data.days, 1)).toFixed(1)} note="Views per day" trend="" /><Stat label="Visitor profiles" value="Not collected" note="Privacy-minimal analytics" trend="" /></div>
      <div className="analytics-grid"><section className="panel traffic-panel"><div className="panel-heading"><div><span className="panel-eyebrow">PAGE VIEWS · DAILY TOTALS</span><h2>Traffic trend</h2></div></div><div className="chart-summary"><b>{data.totalVisits.toLocaleString()}</b><small>views in the selected period</small></div>{data.daily.length ? <div className="analytics-bars">{data.daily.map((item)=><i title={`${item._id}: ${item.visits} views`} style={{height:`${Math.max(4, item.visits / maximum * 100)}%`}} key={item._id}/>)}</div> : <div className="empty-state">No page views recorded during this period.</div>}<div className="chart-x"><span>{data.daily[0]?._id}</span><span>{data.daily.at(-1)?._id}</span></div></section><section className="panel popular-panel"><span className="panel-eyebrow">MOST VIEWED ROUTES</span><h2>Popular pages</h2>{data.topPages.length ? data.topPages.map((item,index)=><div className="popular-row" key={item._id}><span>{String(index+1).padStart(2,'0')}</span><b>{item._id}<small>Page route</small></b><strong>{item.visits}</strong></div>) : <div className="empty-state">Pages will appear here after visits are recorded.</div>}</section></div>
    </>}
  </>
}

function SeoSettings({ notify }: { notify: (message: string) => void }) {
  type Seo = { title: { en: string; ar: string }; description: { en: string; ar: string } }
  const [seo, setSeo] = useState<Seo>({ title: { en: '', ar: '' }, description: { en: '', ar: '' } })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    apiRequest<{ data: { seo?: Partial<Seo> } | null }>('/admin/settings')
      .then(({ data }) => setSeo({ title: { en: data?.seo?.title?.en || '', ar: data?.seo?.title?.ar || '' }, description: { en: data?.seo?.description?.en || '', ar: data?.seo?.description?.ar || '' } }))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load SEO settings.'))
      .finally(() => setLoading(false))
  }, [])
  const save = async () => {
    setSaving(true); setError('')
    try { await apiRequest('/admin/settings', { method: 'PUT', body: JSON.stringify({ seo }) }); notify('SEO settings saved.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save SEO settings.') }
    finally { setSaving(false) }
  }
  return <>
    <div className="page-heading"><div><div className="overline">DISCOVERABILITY / SETTINGS</div><h1>SEO settings</h1><p>Localized site-wide metadata defaults; page-level metadata can override these.</p></div><button className="button-dark" onClick={() => void save()} disabled={saving || loading}>{saving?'Saving…':'Save settings'} <Check size={14}/></button></div>
    {error && <div className="request-error" role="alert">{error}</div>}
    {loading ? <div className="empty-state"><span className="loading-spinner"/><b>Loading SEO settings…</b></div> : <div className="seo-layout"><section className="panel seo-form"><div className="form-section-title"><div><h2>Search appearance</h2><p>Metadata is stored in the website settings record.</p></div></div><div className="field-pair"><label className="field-label">Default title · English<input value={seo.title.en} maxLength={70} onChange={(event)=>setSeo((value)=>({...value,title:{...value.title,en:event.target.value}}))}/></label><label className="field-label">العنوان الافتراضي · العربية<input dir="rtl" value={seo.title.ar} maxLength={70} onChange={(event)=>setSeo((value)=>({...value,title:{...value.title,ar:event.target.value}}))}/></label></div><div className="field-pair"><label className="field-label">Meta description · English<textarea rows={3} value={seo.description.en} maxLength={180} onChange={(event)=>setSeo((value)=>({...value,description:{...value.description,en:event.target.value}}))}/></label><label className="field-label">الوصف التعريفي · العربية<textarea dir="rtl" rows={3} value={seo.description.ar} maxLength={180} onChange={(event)=>setSeo((value)=>({...value,description:{...value.description,ar:event.target.value}}))}/></label></div><p className="field-help">Search engines may choose their own snippets. No indexing flags are stored by this CMS.</p></section><aside className="panel seo-preview"><span className="panel-eyebrow">SEARCH PREVIEW · ENGLISH</span><small>Website homepage</small><h3>{seo.title.en || 'No SEO title configured'}</h3><p>{seo.description.en || 'Add a description to preview the search snippet.'}</p><div className="seo-footnote"><ShieldCheck size={15}/> Preview updates as you edit; save to publish metadata.</div></aside></div>}
  </>
}

function WorkspaceSettings({ notify }: { notify: (message: string) => void }) {
  type Settings = { brandName: { en?: string; ar?: string }; brandInfo: { en?: string; ar?: string }; contactEmail: string; phone: string; whatsapp: string; address: { en?: string; ar?: string }; socials: Record<string,string>; languages: ('en'|'ar')[]; defaultLanguage: 'en'|'ar'; footer: { en?: string; ar?: string }; logo?: string|null }
  const blank = useMemo<Settings>(() => ({ brandName:{en:'',ar:''}, brandInfo:{en:'',ar:''}, contactEmail:'', phone:'', whatsapp:'', address:{en:'',ar:''}, socials:{}, languages:['en','ar'], defaultLanguage:'en', footer:{en:'',ar:''}, logo:null }), [])
  const [settings,setSettings]=useState<Settings>(blank)
  const [logoUrl,setLogoUrl]=useState('')
  const logoInput=useRef<HTMLInputElement>(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [currentPassword,setCurrentPassword]=useState('')
  const [newPassword,setNewPassword]=useState('')
  useEffect(()=>{
    apiRequest<{data:(Omit<Partial<Settings>,'logo'>&{logo?:string|{_id:string;secureUrl:string}|null})|null}>('/admin/settings')
      .then(({data})=>{setSettings({...blank,...data,logo:data?.logo&&typeof data.logo==='object'?data.logo._id:typeof data?.logo==='string'?data.logo:null,brandName:{...blank.brandName,...data?.brandName},brandInfo:{...blank.brandInfo,...data?.brandInfo},address:{...blank.address,...data?.address},footer:{...blank.footer,...data?.footer},socials:data?.socials||{}});setLogoUrl(data?.logo&&typeof data.logo==='object'?data.logo.secureUrl:'')})
      .catch((reason:unknown)=>setError(reason instanceof Error?reason.message:'Could not load settings.'))
      .finally(()=>setLoading(false))
  },[blank])
  const save=async()=>{
    setSaving(true);setError('')
    try{await apiRequest('/admin/settings',{method:'PUT',body:JSON.stringify(settings)});notify('Website settings saved.')}
    catch(reason){setError(reason instanceof Error?reason.message:'Could not save settings.')}
    finally{setSaving(false)}
  }
  const uploadLogo=async(file?:File)=>{
    if(!file)return
    if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>10*1024*1024){setError('Choose a supported image under 10 MB.');return}
    const body=new FormData();body.append('file',file)
    try{const {data}=await apiRequest<{data:{_id:string;secureUrl:string}}>('/admin/media',{method:'POST',body});setSettings((value)=>({...value,logo:data._id}));setLogoUrl(data.secureUrl);notify('Logo uploaded. Save settings to apply it.')}
    catch(reason){setError(reason instanceof Error?reason.message:'Logo upload failed.')}
    finally{if(logoInput.current)logoInput.current.value=''}
  }
  const changePassword=async(event:FormEvent)=>{
    event.preventDefault();setError('')
    try{
      await apiRequest('/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword,newPassword})})
      setCsrfToken('');setCurrentPassword('');setNewPassword('')
      window.location.hash='/admin/login'
      notify('Password updated. Sign in with your new password.')
    }catch(reason){setError(reason instanceof Error?reason.message:'Could not change password.')}
  }
  return <>
    <div className="page-heading"><div><div className="overline">WORKSPACE / PREFERENCES</div><h1>Website settings</h1><p>Brand, contact, language, and footer settings used by the public site.</p></div><button className="button-dark" onClick={()=>void save()} disabled={saving||loading}>{saving?'Saving…':'Save settings'}<Check size={14}/></button></div>
    {error&&<div className="request-error" role="alert">{error}</div>}
    {loading?<div className="empty-state"><span className="loading-spinner"/><b>Loading settings…</b></div>:<div className="settings-panels"><section className="panel setting-card"><span className="panel-eyebrow">BRAND</span><h3>Studio identity</h3><label className="field-label">Name · English<input value={settings.brandName.en||''} onChange={(event)=>setSettings((value)=>({...value,brandName:{...value.brandName,en:event.target.value}}))}/></label><label className="field-label">الاسم · العربية<input dir="rtl" value={settings.brandName.ar||''} onChange={(event)=>setSettings((value)=>({...value,brandName:{...value.brandName,ar:event.target.value}}))}/></label><label className="field-label">Brand information · English<textarea value={settings.brandInfo.en||''} onChange={(event)=>setSettings((value)=>({...value,brandInfo:{...value.brandInfo,en:event.target.value}}))}/></label><label className="field-label">معلومات العلامة · العربية<textarea dir="rtl" value={settings.brandInfo.ar||''} onChange={(event)=>setSettings((value)=>({...value,brandInfo:{...value.brandInfo,ar:event.target.value}}))}/></label><div className="field-label">Logo<input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event)=>void uploadLogo(event.target.files?.[0])}/>{logoUrl&&<img className="settings-logo-preview" src={logoUrl} alt="Website logo preview"/>}<button type="button" className="text-button" onClick={()=>logoInput.current?.click()}>Upload logo</button></div></section><section className="panel setting-card"><span className="panel-eyebrow">LOCALIZATION</span><h3>Website languages</h3><label className="field-label">Default language<select value={settings.defaultLanguage} onChange={(event)=>setSettings((value)=>({...value,defaultLanguage:event.target.value as 'en'|'ar'}))}><option value="en">English</option><option value="ar">العربية</option></select></label>{(['en','ar'] as const).map((lang)=><label className="switch-row" key={lang}><span><b>{lang==='en'?'English':'العربية'}</b></span><button type="button" className={`switch ${settings.languages.includes(lang)?'is-on':''}`} onClick={()=>setSettings((value)=>{if(value.languages.includes(lang)&&value.languages.length===1)return value;const languages=value.languages.includes(lang)?value.languages.filter((item)=>item!==lang):[...value.languages,lang];return {...value,languages,defaultLanguage:languages.includes(value.defaultLanguage)?value.defaultLanguage:languages[0]}})} aria-label={`Toggle ${lang} language`}><i/></button></label>)}</section><section className="panel setting-card"><span className="panel-eyebrow">CONTACT</span><h3>Public contact details</h3><label className="field-label">Contact email<input type="email" value={settings.contactEmail||''} onChange={(event)=>setSettings((value)=>({...value,contactEmail:event.target.value}))}/></label><label className="field-label">Phone<input value={settings.phone||''} onChange={(event)=>setSettings((value)=>({...value,phone:event.target.value}))}/></label><label className="field-label">WhatsApp<input value={settings.whatsapp||''} onChange={(event)=>setSettings((value)=>({...value,whatsapp:event.target.value}))}/></label><label className="field-label">Address · English<input value={settings.address.en||''} onChange={(event)=>setSettings((value)=>({...value,address:{...value.address,en:event.target.value}}))}/></label><label className="field-label">Address · Arabic<input dir="rtl" value={settings.address.ar||''} onChange={(event)=>setSettings((value)=>({...value,address:{...value.address,ar:event.target.value}}))}/></label></section><section className="panel setting-card"><span className="panel-eyebrow">SOCIAL & FOOTER</span><h3>Social links</h3>{['linkedin','github','instagram','x'].map((key)=><label className="field-label" key={key}>{key}<input type="url" value={settings.socials[key]||''} onChange={(event)=>setSettings((value)=>({...value,socials:{...value.socials,[key]:event.target.value}}))}/></label>)}<label className="field-label">Footer · English<textarea value={settings.footer.en||''} onChange={(event)=>setSettings((value)=>({...value,footer:{...value.footer,en:event.target.value}}))}/></label><label className="field-label">التذييل · العربية<textarea dir="rtl" value={settings.footer.ar||''} onChange={(event)=>setSettings((value)=>({...value,footer:{...value.footer,ar:event.target.value}}))}/></label></section><section className="panel setting-card"><span className="panel-eyebrow">ACCOUNT SECURITY</span><h3>Change password</h3><p>Changing your password signs out all active administrator sessions.</p><form onSubmit={(event)=>void changePassword(event)}><label className="field-label">Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event)=>setCurrentPassword(event.target.value)} required/></label><label className="field-label">New password<input type="password" autoComplete="new-password" minLength={14} value={newPassword} onChange={(event)=>setNewPassword(event.target.value)} required/><small>Use at least 14 characters.</small></label><button className="button-outline">Change password</button></form></section></div>}
  </>
}

export default App
