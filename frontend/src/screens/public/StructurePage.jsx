'use client'

import { useEffect, useMemo, useState } from 'react'
import Dropdown from '../../components/dropdown'
import Loading from '../../components/Loading'
import { useVisit } from '../../hooks/useVisit'
import { api, mediaUrl } from '../../lib/api'
import { memberBadge, memberTier } from '../../lib/content'

function MemberCard({ person, delay = 0 }) {
  const photo = mediaUrl(person.foto_url, '/default-avatar.png') || '/default-avatar.png'
  const badge = memberBadge(person.jabatan)
  const highlighted = badge === 'badge-pembimbing'
  return (
    <div
      className={`member-card group w-full max-w-[280px] rounded border p-5 text-center opacity-0 animate-fade-in ${highlighted ? 'border-amber-600/30' : 'border-slate-200'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
        <img src={photo} alt={person.nama} className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0" />
      </div>
      <span className={`mb-2 inline-block rounded px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 ${badge}`}>{person.jabatan}</span>
      <h4 className="font-serif text-lg font-bold leading-tight text-slate-900">{person.nama}</h4>
      <p className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-widest text-slate-400">{person.periode}</p>
    </div>
  )
}

function OrgGrid({ members }) {
  const tiers = useMemo(() => ({
    1: members.filter(item => memberTier(item.jabatan) === 1),
    2: members.filter(item => memberTier(item.jabatan) === 2),
    3: members.filter(item => memberTier(item.jabatan) === 3),
  }), [members])

  const groups = [tiers[1], tiers[2], tiers[3]].filter(group => group.length)
  return (
    <div className="w-full space-y-2">
      {groups.map((group, index) => (
        <div key={index}>
          {index > 0 && <div className="tier-connector mx-auto"><div className="tier-connector-line" /><div className="tier-connector-dot" /></div>}
          {index > 0 && <div className="tier-label">{index === 1 ? 'Koordinasi' : 'Pelaksana'}</div>}
          <div className="flex flex-wrap justify-center gap-4">
            {group.map((person, itemIndex) => <MemberCard person={person} delay={itemIndex * 100} key={person.id} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StructurePage({ initialData = null }) {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState('')
  const initialFirstGroup = Object.keys(initialData?.struktur_grouped || {})[0] || ''
  const [mode, setMode] = useState('tab')
  const [selected, setSelected] = useState(initialFirstGroup)
  const [openPanels, setOpenPanels] = useState(
    initialFirstGroup ? { [initialFirstGroup]: true } : {},
  )
  useVisit('Struktur Kepengurusan')

  useEffect(() => {
    if (initialData) {
      return undefined
    }

    let active = true

    api('/api/public/structure')
      .then(result => {
        if (!active) return

        setData(result)
        const first = Object.keys(result.struktur_grouped || {})[0] || ''
        setSelected(first)
        setOpenPanels(first ? { [first]: true } : {})
      })
      .catch(err => {
        if (active) setError(err.message)
      })

    return () => {
      active = false
    }
  }, [initialData])

  if (!data && !error) return <Loading full />
  if (error) return <main className="mx-auto max-w-5xl px-4 py-32 text-center text-red-700">{error}</main>

  const grouped = data.struktur_grouped || {}
  const entries = Object.entries(grouped)
  const pembimbing = entries.find(([name]) => /pembimbing/i.test(name))
  const root = entries.find(([name]) => /badan pengurus|bph|pimpinan/i.test(name))
  const others = entries.filter(([name]) => name !== pembimbing?.[0] && name !== root?.[0])

  return (
    <main className="flex-grow overflow-x-hidden pt-32 pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl animate-fade-in border-b border-slate-100 pb-8 text-center">
          <span className="mb-4 inline-block rounded border border-primary-200 bg-primary-50 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-900">Kabinet Nexus 2026</span>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Susunan Kepengurusan</h2>
        </div>

        {entries.length ? (
          <>
            <div className="relative z-30 mb-10 flex justify-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="inline-flex rounded border border-slate-100 bg-slate-50 p-1">
                <button type="button" onClick={() => setMode('tab')} className={`rounded px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 ${mode === 'tab' ? 'bg-slate-900 text-slate-50 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-800'}`}>Per Divisi</button>
                <button type="button" onClick={() => setMode('full')} className={`rounded px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-all duration-200 active:scale-95 ${mode === 'full' ? 'bg-slate-900 text-slate-50 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-800'}`}>Lihat Semua</button>
              </div>
            </div>

            {mode === 'tab' ? (
              <div>
                <div className="relative z-20 mx-auto mb-12 max-w-md">
                  <label className="mb-2 block text-center font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Pilih Divisi</label>
                  <Dropdown
                    value={selected}
                    onChange={setSelected}
                    options={entries.map(([name, members]) => ({
                      value: name,
                      label: name,
                      description: `${members.length} personil`,
                    }))}
                    variant="public"
                    ariaLabel="Pilih divisi kepengurusan"
                  />
                </div>
                {selected && (
                  <div className="animate-fade-in">
                    <div className="mb-12 text-center"><h3 className="font-serif text-3xl font-bold text-slate-900">{selected}</h3><div className="mx-auto mt-4 h-px w-12 bg-slate-400" /></div>
                    <OrgGrid members={grouped[selected] || []} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {pembimbing && (
                  <div className="mb-6 overflow-hidden rounded border border-slate-200 bg-slate-50 opacity-0 animate-fade-in">
                    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-6 py-4"><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Dosen pembimbing</span><span className="ml-auto font-serif font-bold text-slate-900">{pembimbing[0]}</span></div>
                    <div className="p-8"><OrgGrid members={pembimbing[1]} /></div>
                  </div>
                )}

                {pembimbing && (root || others.length > 0) && <div className="tier-connector mx-auto -mt-6 mb-2"><div className="tier-connector-line" style={{ height: '3rem' }} /><div className="tier-connector-dot" /></div>}

                {root && (
                  <div className="overflow-hidden rounded border border-slate-200 bg-slate-50 opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center gap-3 bg-slate-900 px-6 py-4"><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Pimpinan Utama</span><span className="ml-auto font-serif font-bold text-slate-50">{root[0]}</span></div>
                    <div className="p-8"><OrgGrid members={root[1]} /></div>
                  </div>
                )}

                {root && others.length > 0 && <div className="tier-connector mx-auto"><div className="tier-connector-line" style={{ height: '2.5rem' }} /><div className="tier-connector-dot" /><div className="mt-1 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Divisi</div></div>}

                {others.length > 0 && (
                  <div className="space-y-3">
                    {others.map(([name, members], index) => {
                      const open = !!openPanels[name]
                      return (
                        <div className="overflow-hidden rounded border border-slate-200 bg-slate-50 opacity-0 animate-fade-in" style={{ animationDelay: `${300 + index * 100}ms` }} key={name}>
                          <button type="button" onClick={() => setOpenPanels(value => ({ ...value, [name]: !value[name] }))} className="group flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200">
                            <div className="flex items-center gap-4"><span className="font-serif text-lg font-bold text-slate-900">{name}</span><span className="rounded border border-slate-200 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500 transition-colors group-hover:bg-slate-200">{members.length} Personil</span></div>
                            <svg className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <div className={`accordion-wrapper border-t border-slate-200 ${open ? 'open' : ''}`}><div className="accordion-inner"><div className="px-6 pt-6 pb-8"><OrgGrid members={members} /></div></div></div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mt-12 animate-fade-in"><div className="rounded border border-slate-200 bg-slate-50 p-12 text-center"><p className="font-mono text-sm font-bold uppercase tracking-widest text-slate-500">Data pengurus belum tersedia.</p></div></div>
        )}
      </div>
    </main>
  )
}
