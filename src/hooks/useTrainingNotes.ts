import { useCallback } from 'react'
import { Bandage, NotebookPen, Star, type LucideIcon } from 'lucide-react'
import { COLORS, type ColorStyles } from '../data/palette'
import { createCollection, newId } from '../lib/cloudStore'

export type NoteCategory = 'importante' | 'lesion' | 'general'

export interface TrainingNote {
  id: string
  sessionId?: string
  category: NoteCategory
  title: string
  body: string
  date: string
}

export const NOTE_CATEGORY_META: Record<
  NoteCategory,
  { label: string; Icon: LucideIcon; color: ColorStyles }
> = {
  importante: { label: 'Importante', Icon: Star, color: COLORS.amber },
  lesion: { label: 'Lesión / molestia', Icon: Bandage, color: COLORS.rose },
  general: { label: 'General', Icon: NotebookPen, color: COLORS.slate },
}

interface NoteRow {
  id: string
  session_id: string | null
  category: string
  title: string | null
  body: string | null
  date: string
}

const notesStore = createCollection<TrainingNote, NoteRow>({
  key: 'mivida:training-notes:v1',
  table: 'training_notes',
  rowToItem: (r) => ({
    id: r.id,
    sessionId: r.session_id ?? undefined,
    category: (r.category as NoteCategory) ?? 'general',
    title: r.title ?? '',
    body: r.body ?? '',
    date: r.date,
  }),
  itemToRow: (nt, userId) => ({
    id: nt.id,
    user_id: userId,
    session_id: nt.sessionId ?? null,
    category: nt.category,
    title: nt.title,
    body: nt.body,
    date: nt.date,
    updated_at: new Date().toISOString(),
  }),
})

export function useTrainingNotes() {
  const all = notesStore.useAll()
  const notes = [...all].sort((a, b) => b.date.localeCompare(a.date))

  const addNote = useCallback((note: Omit<TrainingNote, 'id'>) => {
    notesStore.upsert({ ...note, id: newId() })
  }, [])

  const removeNote = useCallback((id: string) => {
    notesStore.remove(id)
  }, [])

  return { notes, addNote, removeNote }
}
