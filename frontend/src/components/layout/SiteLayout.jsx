import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Factory, Menu, X } from 'lucide-react'
import { getHealth } from '../../api/healthApi'

const links = [
  ['Marketplace', '/marketplace'],
  ['Seller', '/seller'],
  ['Buyer', '/buyer'],
  ['Admin review', '/admin'],
]

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState('checking')
  useEffect(() => {
    getHealth().then(data => setApiStatus(data.status === 'UP' ? 'online' : 'offline')).catch(() => setApiStatus('offline'))
  }, [])
  return <div className="app-shell">
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" to="/"><span className="brand-mark"><Factory size={21}/></span><span>Industrial <b>Mart</b><small>Industrial supply marketplace</small></span></Link>
        <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button>
        <nav className={`main-nav ${menuOpen?'nav-open':''}`}>
          {links.map(([label, path]) => <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({isActive})=>isActive?'nav-link active':'nav-link'}>{label}</NavLink>)}
          <span className={`api-indicator api-${apiStatus}`}><i/>{apiStatus === 'online' ? 'API online' : apiStatus === 'offline' ? 'API unavailable' : 'Connecting'}</span>
        </nav>
      </div>
    </header>
    <main className="page-main"><Outlet/></main>
    <footer className="site-footer"><div><span className="brand-mark small"><Factory size={17}/></span><span>Industrial Mart</span></div><p>Industrial machinery and supplies marketplace.</p></footer>
  </div>
}
