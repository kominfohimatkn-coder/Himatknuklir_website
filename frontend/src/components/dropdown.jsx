'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

const variantClasses = {
  admin: {
    trigger:
      'border-[var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-hover)] focus-visible:border-[var(--admin-accent-border)] focus-visible:ring-[var(--admin-accent-soft)]',
    label: 'text-[var(--admin-text)]',
    muted: 'text-[var(--admin-muted)]',
    menu:
      'border-[var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)]',
    option: 'hover:bg-[var(--admin-hover)]',
    selected:
      'border-[var(--admin-accent-border)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]',
    icon:
      'border-[var(--admin-border)] bg-[var(--admin-panel-muted)] text-[var(--admin-muted)]',
    iconSelected:
      'border-[var(--admin-accent-border)] bg-[var(--admin-panel)] text-[var(--admin-accent)]',
    check:
      'border-[var(--admin-accent)] bg-[var(--admin-accent)] text-white',
    checkEmpty:
      'border-[var(--admin-border)] text-transparent',
  },
  public: {
    trigger:
      'border-slate-200 bg-slate-50 text-slate-900 hover:border-primary-800 hover:bg-white focus-visible:border-primary-900 focus-visible:ring-primary-100',
    label: 'text-slate-900',
    muted: 'text-slate-500',
    menu: 'border-slate-200 bg-[#fcfefb] text-slate-900',
    option: 'hover:bg-primary-50',
    selected:
      'border-primary-200 bg-primary-50 text-primary-950',
    icon:
      'border-slate-200 bg-white text-slate-500',
    iconSelected:
      'border-primary-200 bg-white text-primary-900',
    check:
      'border-primary-900 bg-primary-900 text-white',
    checkEmpty:
      'border-slate-200 text-transparent',
  },
}

function classNames(...values) {
  return values.filter(Boolean).join(' ')
}

function getEnabledIndexes(options) {
  return options.reduce((indexes, option, index) => {
    if (!option.disabled) indexes.push(index)
    return indexes
  }, [])
}

export default function Dropdown({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi',
  variant = 'admin',
  compact = false,
  disabled = false,
  className = '',
  menuClassName = '',
  ariaLabel,
  showDescription = true,
  menuMaxHeight = 360,
}) {
  const generatedId = useId()
  const dropdownId = id || `dropdown-${generatedId.replace(/:/g, '')}`
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const optionRefs = useRef([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState(null)

  const styles = variantClasses[variant] || variantClasses.admin
  const selectedIndex = options.findIndex(option => option.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null
  const SelectedIcon = selectedOption?.icon

  const enabledIndexes = useMemo(
    () => getEnabledIndexes(options),
    [options],
  )

  const calculatePosition = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const computed = window.getComputedStyle(button)
    const inheritedVariables = [
      '--admin-border',
      '--admin-border-strong',
      '--admin-input',
      '--admin-panel',
      '--admin-panel-muted',
      '--admin-hover',
      '--admin-text',
      '--admin-muted',
      '--admin-accent',
      '--admin-accent-soft',
      '--admin-accent-border',
    ].reduce((variables, variable) => {
      const resolved = computed.getPropertyValue(variable).trim()
      if (resolved) variables[variable] = resolved
      return variables
    }, {})
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const safeGap = 8
    const edge = 12
    const desiredHeight = Math.min(
      menuMaxHeight,
      Math.max(120, options.length * 54 + 12),
    )
    const roomBelow = viewportHeight - rect.bottom - edge
    const roomAbove = rect.top - edge
    const openAbove = roomBelow < Math.min(desiredHeight, 220) && roomAbove > roomBelow
    const availableHeight = Math.max(
      120,
      Math.min(
        desiredHeight,
        openAbove ? roomAbove - safeGap : roomBelow - safeGap,
      ),
    )
    const width = Math.min(rect.width, viewportWidth - edge * 2)
    const left = Math.min(
      Math.max(edge, rect.left),
      viewportWidth - width - edge,
    )
    const top = openAbove
      ? Math.max(edge, rect.top - availableHeight - safeGap)
      : Math.min(viewportHeight - availableHeight - edge, rect.bottom + safeGap)

    setMenuPosition({
      left,
      top,
      width,
      maxHeight: availableHeight,
      inheritedVariables,
    })
  }, [menuMaxHeight, options.length])

  useLayoutEffect(() => {
    if (!open) return undefined

    calculatePosition()

    const selected = selectedIndex >= 0
      ? selectedIndex
      : enabledIndexes[0] ?? -1
    setActiveIndex(selected)

    const frame = window.requestAnimationFrame(() => {
      optionRefs.current[selected]?.scrollIntoView({ block: 'nearest' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [open, selectedIndex, enabledIndexes, calculatePosition])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    function handleViewportChange() {
      calculatePosition()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [open, calculatePosition])

  function selectOption(option) {
    if (option.disabled) return
    onChange?.(option.value, option)
    setOpen(false)
    window.requestAnimationFrame(() => buttonRef.current?.focus())
  }

  function moveActive(direction) {
    if (!enabledIndexes.length) return

    const currentPosition = enabledIndexes.indexOf(activeIndex)
    const nextPosition = currentPosition < 0
      ? 0
      : (currentPosition + direction + enabledIndexes.length) % enabledIndexes.length
    const nextIndex = enabledIndexes[nextPosition]

    setActiveIndex(nextIndex)
    optionRefs.current[nextIndex]?.scrollIntoView({ block: 'nearest' })
  }

  function handleButtonKeyDown(event) {
    if (disabled) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
      } else {
        moveActive(event.key === 'ArrowDown' ? 1 : -1)
      }
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
      } else if (activeIndex >= 0) {
        selectOption(options[activeIndex])
      }
    }
  }

  function handleMenuKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActive(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      const first = enabledIndexes[0] ?? -1
      setActiveIndex(first)
      optionRefs.current[first]?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'End') {
      event.preventDefault()
      const last = enabledIndexes.at(-1) ?? -1
      setActiveIndex(last)
      optionRefs.current[last]?.scrollIntoView({ block: 'nearest' })
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (activeIndex >= 0) selectOption(options[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  const menu = open && menuPosition && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          id={`${dropdownId}-menu`}
          role="listbox"
          aria-label={ariaLabel || placeholder}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={classNames(
            'overflow-hidden rounded-md border shadow-[0_18px_50px_rgba(0,0,0,0.22)]',
            styles.menu,
            menuClassName,
          )}
          style={{
            position: 'fixed',
            zIndex: 250,
            left: menuPosition.left,
            top: menuPosition.top,
            width: menuPosition.width,
            ...menuPosition.inheritedVariables,
          }}
        >
          <div
            className="overflow-y-auto p-1.5"
            style={{ maxHeight: menuPosition.maxHeight }}
          >
            {options.length ? options.map((option, index) => {
              const Icon = option.icon
              const selected = option.value === value
              const active = index === activeIndex

              return (
                <button
                  key={String(option.value)}
                  ref={element => {
                    optionRefs.current[index] = element
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  onMouseEnter={() => {
                    if (!option.disabled) setActiveIndex(index)
                  }}
                  onClick={() => selectOption(option)}
                  className={classNames(
                    'group flex w-full items-center gap-3 rounded-md border px-3 text-left outline-none transition',
                    compact ? 'min-h-10 py-2' : 'min-h-12 py-2.5',
                    selected
                      ? styles.selected
                      : `border-transparent ${styles.option}`,
                    active && !selected ? 'ring-1 ring-inset ring-current/15' : '',
                    option.disabled ? 'cursor-not-allowed opacity-45' : '',
                  )}
                >
                  {Icon && (
                    <span
                      className={classNames(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition',
                        selected ? styles.iconSelected : styles.icon,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span
                      className={classNames(
                        'block truncate text-sm font-bold',
                        selected ? '' : styles.label,
                      )}
                    >
                      {option.label}
                    </span>

                    {showDescription && option.description && (
                      <span
                        className={classNames(
                          'mt-0.5 block line-clamp-2 text-[10px] leading-4',
                          styles.muted,
                        )}
                      >
                        {option.description}
                      </span>
                    )}
                  </span>

                  <span
                    className={classNames(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                      selected ? styles.check : styles.checkEmpty,
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </button>
              )
            }) : (
              <p className={classNames('px-3 py-5 text-center text-xs', styles.muted)}>
                Tidak ada pilihan.
              </p>
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className={classNames('relative min-w-0', className)}>
      {name && <input type="hidden" name={name} value={value ?? ''} />}

      <button
        ref={buttonRef}
        id={dropdownId}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={`${dropdownId}-menu`}
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        onKeyDown={handleButtonKeyDown}
        className={classNames(
          'flex w-full items-center gap-3 rounded-md border text-left outline-none transition focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
          compact ? 'min-h-10 px-3 py-2' : 'min-h-11 px-3.5 py-2.5',
          styles.trigger,
        )}
      >
        {SelectedIcon && (
          <span
            className={classNames(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
              styles.iconSelected,
            )}
          >
            <SelectedIcon className="h-4 w-4" />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span
            className={classNames(
              'block truncate text-sm font-semibold',
              selectedOption ? styles.label : styles.muted,
            )}
          >
            {selectedOption?.label || placeholder}
          </span>

          {showDescription && selectedOption?.description && !compact && (
            <span className={classNames('mt-0.5 block truncate text-[10px]', styles.muted)}>
              {selectedOption.description}
            </span>
          )}
        </span>

        <ChevronDown
          className={classNames(
            'h-4 w-4 shrink-0 transition-transform duration-200',
            styles.muted,
            open ? 'rotate-180' : '',
          )}
        />
      </button>

      {menu}
    </div>
  )
}
