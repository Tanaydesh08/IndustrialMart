import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Factory, Menu, X, Languages, LogOut } from 'lucide-react'
import { getHealth } from '../../api/healthApi'
import { useApp } from '../../context/AppContext'

const links = [
  ['Marketplace', '/marketplace'],
  ['Seller', '/seller'],
  ['Buyer', '/buyer'],
          ['Payments & ledger', '/payments'],
  ['Admin review', '/admin'],
]

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')
  const { language, setLanguage, user, signOut, t } = useApp()
  useEffect(() => {
    getHealth().then(data => setApiStatus(data.status === 'UP' ? 'online' : 'offline')).catch(() => setApiStatus('offline'))
  }, [])
  return <div className="app-shell">
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" to="/"><span className="brand-mark"><Factory size={21}/></span><span>Industrial <b>Mart</b><small>Industrial supply marketplace</small></span></Link>
        <div className="header-controls"><button className="language-toggle" onClick={()=>setLanguage(language==='en'?'hi':'en')} aria-label="Switch language"><Languages size={16}/><span>{language==='en'?'हिन्दी':'English'}</span></button>{user?<button className="language-toggle logout-button" onClick={()=>{signOut();setMenuOpen(false)}}><LogOut size={15}/><span>{t('Sign out')}</span></button>:<Link className="language-toggle login-link" to="/login">{t('Log in')}</Link>}<button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button></div>
        <nav className={`main-nav ${menuOpen?'nav-open':''}`}>
          {links.filter(([,path])=>user&&(path==='/marketplace'||path==='/seller'&&user.role==='SELLER'||(path==='/buyer'||path==='/payments')&&user.role==='BUYER'||path==='/admin'&&user.role==='ADMIN')).map(([label, path]) => <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({isActive})=>isActive?'nav-link active':'nav-link'}>{t(label)}</NavLink>)}
          <span className={`api-indicator api-${apiStatus}`}><i/>{t(apiStatus === 'online' ? 'API online' : apiStatus === 'offline' ? 'API unavailable' : 'Connecting')}</span>
        </nav>
      </div>
    </header>
    <main className="page-main"><Outlet/></main>
    <footer className="site-footer"><div><span className="brand-mark small"><Factory size={17}/></span><span>Industrial Mart</span></div><p>{t('Industrial machinery and supplies marketplace.')}</p></footer>
  </div>
}
