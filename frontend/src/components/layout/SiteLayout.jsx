import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Factory, Menu, X, LogOut } from 'lucide-react'
import { getHealth } from '../../api/healthApi'
import { useApp } from '../../context/AppContext'

const links = [['Deals','/marketplace'],['Seller','/seller'],['Buyer','/buyer'],['Admin Panel','/admin']]

export default function SiteLayout() {
  const [menuOpen,setMenuOpen]=useState(false)
  const [apiStatus,setApiStatus]=useState('checking')
  const {user,signOut,t,language,setLanguage}=useApp()
  useEffect(()=>{getHealth().then(data=>setApiStatus(data.status==='UP'?'online':'offline')).catch(()=>setApiStatus('offline'))},[])
  return <div className="app-shell">
    <header className="site-header"><div className="site-header-inner">
      <Link className="brand" to="/"><span className="brand-mark"><Factory size={21}/></span><span>Industrial <b>Mart</b></span></Link>
      <div className="header-controls"><button type="button" className="language-toggle" aria-pressed={language === 'hi'} aria-label={t(language === 'en' ? 'Switch language to Hindi (Roman)' : 'Switch language to English')} onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}>{language === 'en' ? 'English' : 'Hindi (Roman)'}</button>{user?<button className="language-toggle logout-button" onClick={()=>{signOut();setMenuOpen(false)}}><LogOut size={15}/><span>{t('Sign out')}</span></button>:<Link className="language-toggle login-link" to="/login">Login</Link>}<button className="mobile-menu" aria-label={t('Toggle navigation')} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button></div>
      <nav className={`main-nav ${menuOpen?'nav-open':''}`}>
        {user&&links.filter(([,path])=>path==='/marketplace'||(path==='/seller'&&user.role==='SELLER'||path==='/buyer'&&user.role==='BUYER'||path==='/admin'&&user.role==='ADMIN')).map(([label,path])=><NavLink key={path} to={path} onClick={()=>setMenuOpen(false)} className={({isActive})=>isActive?'nav-link active':'nav-link'}>{t(label)}</NavLink>)}
        {user&&<button className="nav-link nav-logout" onClick={()=>{signOut();setMenuOpen(false)}}><LogOut size={15}/><span>{t('Sign out')}</span></button>}
        <span className={`api-indicator api-${apiStatus}`}><i/>{t(apiStatus==='online'?'API online':apiStatus==='offline'?'API unavailable':'Connecting')}</span>
      </nav>
    </div></header>
    <main className="page-main"><Outlet/></main>
    <footer className="site-footer"><div><span className="brand-mark small"><Factory size={17}/></span><span>Industrial Mart</span></div></footer>
  </div>
}
