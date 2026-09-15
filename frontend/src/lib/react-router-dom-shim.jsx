'use client'

import NextLink from 'next/link'
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
} from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export function Link({ to, href, replace = false, children, ...props }) {
  return (
    <NextLink href={to ?? href ?? '/'} replace={replace} {...props}>
      {children}
    </NextLink>
  )
}

export function NavLink({ to, className, children, ...props }) {
  const pathname = usePathname()
  const target = String(to || '/')
  const isActive =
    pathname === target ||
    (target !== '/' && pathname.startsWith(`${target}/`))
  const resolvedClassName =
    typeof className === 'function' ? className({ isActive }) : className

  return (
    <NextLink href={target} className={resolvedClassName} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </NextLink>
  )
}

export function Navigate({ to, replace = false }) {
  const router = useRouter()

  useEffect(() => {
    if (replace) router.replace(to)
    else router.push(to)
  }, [replace, router, to])

  return null
}

export function useNavigate() {
  const router = useRouter()

  return useMemo(
    () => (to, options = {}) => {
      if (typeof to === 'number') {
        if (to < 0) router.back()
        return
      }

      if (options.replace) router.replace(to)
      else router.push(to)
    },
    [router],
  )
}

export function useLocation() {
  const pathname = usePathname()
  const [hash, setHash] = useState('')

  useEffect(() => {
    const update = () => setHash(window.location.hash || '')
    update()
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [pathname])

  return { pathname, hash }
}

export function useParams() {
  return useNextParams()
}

export function Outlet() {
  return null
}
