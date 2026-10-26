import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translate, translateError } from '../i18n/labels'

const Context = createContext(null)
export function AppProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('im-language') || 'en')
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('im-user') || 'null') } catch { return null } })
  useEffect(() => { document.documentElement.lang = language === 'hi' ? 'hi-Latn' : 'en' }, [language])
  useEffect(() => {
    const expire = () => { localStorage.removeItem('im-user'); localStorage.removeItem('im-token'); setUser(null); window.location.assign('/login') }
    window.addEventListener('im:unauthorized', expire)
    return () => window.removeEventListener('im:unauthorized', expire)
  }, [])
  const value = useMemo(() => ({ language, setLanguage: next => { localStorage.setItem('im-language', next); setLanguage(next) }, user, signIn: data => { localStorage.setItem('im-user', JSON.stringify(data)); localStorage.setItem('im-token', data.token); setUser(data) }, signOut: () => { localStorage.removeItem('im-user'); localStorage.removeItem('im-token'); setUser(null) }, t: (key, values) => translate(key, language, values), tError: message => translateError(message, language) }), [language, user])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export const useApp = () => useContext(Context)
