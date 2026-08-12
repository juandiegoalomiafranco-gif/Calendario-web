import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { COLOR_ORDER, COLORS, colorOf, type ColorKey } from '../data/palette'
import type { SchoolClass } from '../data/schoolTypes'
import { useSchoolSetup } from '../hooks/useSchool'
import { classList, makeClassCode, usedClassCodes } from '../lib/school'
import { cx } from '../lib/cx'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Field, Select, TextInput } from '../components/ui/Field'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Sheet } from '../components/ui/Sheet'

const CYCLE_DAYS = [1, 2, 3, 4, 5, 6]

type Tab = 'materias' | 'horario'

/**
 * Gestión del colegio: crear y editar materias, y armar el horario de los 6 días
 * del ciclo. Arranca con el horario real de Grade 11 y desde aquí se cambia para
 * un año electivo nuevo sin tocar el código.
 */
export function Materias() {
  const { setup, upsertClass, removeClass, setSlot, resetSetup, isCustom } = useSchoolSetup()
  const [tab, setTab] = useState<Tab>('materias')
  const [editing, setEditing] = useState<SchoolClass | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [cycleDay, setCycleDay] = useState(1)

  const classes = classList(setup)
  const used = usedClassCodes(setup)

  function openNew() {
    setEditing({ code: '', name: '', teacher: '', color: 'blue' })
    setIsNew(true)
  }

  function openEdit(cls: SchoolClass) {
    setEditing(cls)
    setIsNew(false)
  }

  function saveClass() {
    if (!editing) return
    const name = editing.name.trim()
    if (!name) return
    const code = isNew ? makeClassCode(name, setup.classes) : editing.code
    upsertClass({ ...editing, name, teacher: editing.teacher.trim(), code })
    setEditing(null)
  }

  function deleteClass() {
    if (!editing || isNew) return
    removeClass(editing.code)
    setEditing(null)
  }

  const daySlots = setup.timetable[cycleDay] ?? []
  const slotFor = (period: string) => daySlots.find((s) => s.period === period)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        eyebrow={
          <Link to="/colegio" className="inline-flex items-center gap-1 hover:text-content">
            <ArrowLeft size={14} aria-hidden /> Colegio
          </Link>
        }
        title="Materias y horario"
        actions={
          <>
            <SegmentedControl
              options={[
                { value: 'materias', label: 'Materias' },
                { value: 'horario', label: 'Horario' },
              ]}
              value={tab}
              onChange={setTab}
              ariaLabel="Qué editar"
            />
            {isCustom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('¿Volver al horario original de Grade 11? Se perderán tus cambios.')) {
                    resetSetup()
                  }
                }}
              >
                <RotateCcw size={14} aria-hidden />
                Restablecer
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={openNew}>
              <Plus size={15} aria-hidden />
              Materia
            </Button>
          </>
        }
      />

      {tab === 'materias' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => {
            const color = colorOf(cls.color)
            const inUse = used.has(cls.code)
            return (
              <Card key={cls.code} className="flex items-center gap-3">
                <span className={cx('h-11 w-1.5 shrink-0 rounded-full', color.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-content">{cls.name}</p>
                  <p className="truncate text-xs text-content-muted">
                    {cls.teacher || 'Sin profesor'} · {cls.code}
                  </p>
                  {!inUse && (
                    <p className="mt-0.5 text-[11px] font-semibold text-warn">
                      No está en el horario
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cls)} aria-label={`Editar ${cls.name}`}>
                  <Pencil size={15} aria-hidden />
                </Button>
              </Card>
            )
          })}

          {classes.length === 0 && (
            <Card className="sm:col-span-2 xl:col-span-3">
              <p className="text-sm text-content-muted">
                Aún no tienes materias. Crea la primera con el botón «Materia».
              </p>
            </Card>
          )}
        </div>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <CardHeader
              title={`Día ${cycleDay} del ciclo`}
              className="mb-0"
              action={
                <SegmentedControl
                  options={CYCLE_DAYS.map((d) => ({ value: String(d), label: String(d) }))}
                  value={String(cycleDay)}
                  onChange={(v) => setCycleDay(Number(v))}
                  ariaLabel="Día del ciclo"
                />
              }
            />
          </div>

          <ul className="divide-y divide-line">
            {setup.periods.map((p) => {
              const slot = slotFor(p.period)
              const cls = slot ? setup.classes[slot.classCode] : undefined
              const color = cls ? colorOf(cls.color) : undefined

              if (p.kind === 'break') {
                return (
                  <li
                    key={p.period}
                    className="flex items-center gap-3 bg-surface-2/60 px-4 py-2.5 text-xs text-content-muted"
                  >
                    <span className="w-24 shrink-0 tabular">
                      {p.start}–{p.end}
                    </span>
                    {p.period}
                  </li>
                )
              }

              return (
                <li key={p.period} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs tabular text-content-muted">
                    {p.start}–{p.end}
                  </span>
                  <span className="w-10 shrink-0 text-sm font-bold text-content">{p.period}</span>

                  <span className={cx('h-8 w-1 shrink-0 rounded-full', color?.dot ?? 'bg-line')} />

                  <Select
                    aria-label={`Materia del ${p.period}`}
                    value={slot?.classCode ?? ''}
                    onChange={(e) => setSlot(cycleDay, p.period, e.target.value, slot?.room ?? '')}
                    className="min-w-[10rem] flex-1"
                  >
                    <option value="">— Libre —</option>
                    {classes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </Select>

                  <TextInput
                    aria-label={`Salón del ${p.period}`}
                    value={slot?.room ?? ''}
                    onChange={(e) => setSlot(cycleDay, p.period, slot?.classCode ?? '', e.target.value)}
                    placeholder="Salón"
                    disabled={!slot?.classCode}
                    className="w-28 shrink-0 disabled:opacity-40"
                  />
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Crear o editar materia */}
      <Sheet
        open={editing != null}
        onClose={() => setEditing(null)}
        title={isNew ? 'Nueva materia' : 'Editar materia'}
        subtitle={!isNew && editing ? editing.code : undefined}
        footer={
          <div className="flex gap-2">
            {!isNew && (
              <Button variant="danger" size="lg" onClick={deleteClass}>
                <Trash2 size={16} aria-hidden />
                Borrar
              </Button>
            )}
            <Button variant="primary" size="lg" className="flex-1 justify-center" onClick={saveClass}>
              Guardar
            </Button>
          </div>
        }
      >
        {editing && (
          <>
            <Field label="Nombre">
              <TextInput
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Matemáticas"
                autoFocus
              />
            </Field>

            <Field label="Profesor (opcional)">
              <TextInput
                value={editing.teacher}
                onChange={(e) => setEditing({ ...editing, teacher: e.target.value })}
                placeholder="Iniciales o nombre"
              />
            </Field>

            <Field label="Color" hint="Es el color con el que aparece en todo MyLife.">
              <div className="flex flex-wrap gap-2">
                {COLOR_ORDER.map((key: ColorKey) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={COLORS[key].label}
                    aria-pressed={editing.color === key}
                    onClick={() => setEditing({ ...editing, color: key })}
                    className={cx(
                      'h-9 w-9 rounded-xl transition-transform',
                      COLORS[key].dot,
                      editing.color === key
                        ? 'ring-2 ring-content ring-offset-2 ring-offset-surface'
                        : 'hover:scale-105',
                    )}
                  />
                ))}
              </div>
            </Field>
          </>
        )}
      </Sheet>
    </div>
  )
}
