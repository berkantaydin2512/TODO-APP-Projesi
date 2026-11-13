import { useState, type FormEvent } from 'react'
import './App.css'

type Task = {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

type Filter = 'all' | 'active' | 'completed'

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false

  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'number'
  )
}

function loadTasks(): { tasks: Task[]; error: string | null } {
  try {
    const savedTasks = window.localStorage.getItem('todo-list-tasks')
    if (!savedTasks) return { tasks: [], error: null }

    const parsed: unknown = JSON.parse(savedTasks)
    if (!Array.isArray(parsed) || !parsed.every(isTask)) {
      throw new Error('Kaydedilen görev verisi geçersiz.')
    }

    return { tasks: parsed, error: null }
  } catch (error) {
    console.error('Görevler tarayıcı depolamasından okunamadı:', error)
    return {
      tasks: [],
      error: 'Görevler yüklenemedi. Tarayıcı depolama erişimini kontrol edin.',
    }
  }
}

function App() {
  const [initialState] = useState(loadTasks)
  const [tasks, setTasks] = useState<Task[]>(initialState.tasks)
  const [storageError, setStorageError] = useState(initialState.error)
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  function saveTasks(nextTasks: Task[]) {
    setTasks(nextTasks)
    try {
      window.localStorage.setItem('todo-list-tasks', JSON.stringify(nextTasks))
      setStorageError(null)
    } catch (error) {
      console.error('Görevler tarayıcı depolamasına kaydedilemedi:', error)
      setStorageError('Değişiklikler kaydedilemedi. Tarayıcı depolama alanınızı kontrol edin.')
    }
  }

  const activeCount = tasks.filter((task) => !task.completed).length
  const completedCount = tasks.length - activeCount
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    if (editingId) {
      saveTasks(
        tasks.map((task) =>
          task.id === editingId ? { ...task, title: trimmedTitle } : task,
        ),
      )
      setEditingId(null)
    } else {
      saveTasks([
        { id: crypto.randomUUID(), title: trimmedTitle, completed: false, createdAt: Date.now() },
        ...tasks,
      ])
    }

    setTitle('')
  }

  function startEditing(task: Task) {
    setTitle(task.title)
    setEditingId(task.id)
    document.getElementById('task-title')?.focus()
  }

  function cancelEditing() {
    setEditingId(null)
    setTitle('')
  }

  function toggleTask(id: string) {
    saveTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function deleteTask(id: string) {
    saveTasks(tasks.filter((task) => task.id !== id))
    if (editingId === id) cancelEditing()
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'Tümü', count: tasks.length },
    { key: 'active', label: 'Devam eden', count: activeCount },
    { key: 'completed', label: 'Tamamlanan', count: completedCount },
  ]

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Yapılacaklar ana sayfa">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m7.5 12.5 3 3 6-7" />
              <path d="M19 12v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h8" />
            </svg>
          </span>
          <span>Yapılacak<span className="brand-accent">lar</span></span>
        </a>
        <span className="today-label">
          {new Intl.DateTimeFormat('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(new Date())}
        </span>
      </header>

      <section className="main-content">
        <div className="intro">
          <p className="eyebrow">GÜNÜNÜ PLANLA</p>
          <h1>Bugün neler yapacaksın?</h1>
          <p className="intro-copy">Aklındakileri listele, adım adım tamamla.</p>
        </div>

        <section className="summary" aria-label="Görev özeti">
          <div className="summary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M8 5h11M8 12h11M8 19h11M4 5h.01M4 12h.01M4 19h.01" />
            </svg>
          </div>
          <div className="summary-text">
            <strong>{activeCount} görev</strong>
            <span>tamamlanmayı bekliyor</span>
          </div>
          <div className="summary-progress" aria-label={`${completedCount} görev tamamlandı`}>
            <span>{completedCount}</span>
            <span className="summary-divider">/</span>
            <span>{tasks.length}</span>
            <small>TAMAMLANDI</small>
          </div>
        </section>

        {storageError && (
          <p className="storage-message" role="status">
            {storageError}
          </p>
        )}

        <form className="task-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="task-title">
            {editingId ? 'Görevi düzenle' : 'Yeni görev'}
          </label>
          <span className="input-icon" aria-hidden="true">
            {editingId ? '✎' : '+'}
          </span>
          <input
            id="task-title"
            type="text"
            placeholder={editingId ? 'Görev adını düzenle...' : 'Bugün ne yapman gerekiyor?'}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            autoComplete="off"
          />
          {editingId && (
            <button className="cancel-button" type="button" onClick={cancelEditing}>
              Vazgeç
            </button>
          )}
          <button className="submit-button" type="submit" disabled={!title.trim()}>
            {editingId ? 'Kaydet' : 'Görev ekle'}
          </button>
        </form>

        <section className="task-section" aria-label="Görev listesi">
          <div className="list-heading">
            <h2>Görevlerin</h2>
            <div className="filters" role="group" aria-label="Görevleri filtrele">
              {filters.map((item) => (
                <button
                  className={`filter-button${filter === item.key ? ' selected' : ''}`}
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                  <span>{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {visibleTasks.length > 0 ? (
            <ul className="task-list">
              {visibleTasks.map((task) => (
                <li className={`task-item${task.completed ? ' is-completed' : ''}`} key={task.id}>
                  <button
                    className="check-button"
                    type="button"
                    aria-label={task.completed ? `${task.title} görevini geri al` : `${task.title} görevini tamamla`}
                    aria-pressed={task.completed}
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.completed && (
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="m3.5 8 3 3 6-6" />
                      </svg>
                    )}
                  </button>
                  <div className="task-content">
                    <span className="task-title">{task.title}</span>
                    <span className="task-date">
                      Eklendi ·{' '}
                      {new Intl.DateTimeFormat('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                      }).format(task.createdAt)}
                    </span>
                  </div>
                  <div className="task-actions">
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`${task.title} görevini düzenle`}
                      onClick={() => startEditing(task)}
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="m13.5 4.5 2 2M4 16l3.5-.8L16 6.7a1.4 1.4 0 0 0-2-2l-8.5 8.5L4 16Z" />
                      </svg>
                    </button>
                    <button
                      className="icon-button delete-button"
                      type="button"
                      aria-label={`${task.title} görevini sil`}
                      onClick={() => deleteTask(task.id)}
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.6 9.5H6.1L5.5 6m3 2.5v4m3-4v4" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">
                {filter === 'completed' ? '✓' : '✦'}
              </span>
              <h3>
                {filter === 'all'
                  ? 'Listen henüz boş'
                  : filter === 'active'
                    ? 'Devam eden görevin yok'
                    : 'Henüz tamamlanan görev yok'}
              </h3>
              <p>
                {filter === 'all'
                  ? 'Yukarıdan ilk görevini ekleyerek başlayabilirsin.'
                  : 'Görevlerin burada görünecek.'}
              </p>
            </div>
          )}
        </section>

        <footer className="footer-note">
          <span className="footer-dot" />
          Görevlerin bu cihazda otomatik olarak saklanır
        </footer>
      </section>
    </main>
  )
}

export default App
