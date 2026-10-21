import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import BuyerDashboardPage from './pages/BuyerDashboardPage'
import CreateListingPage from './pages/CreateListingPage'
import HomePage from './pages/HomePage'
import ListingDetailsPage from './pages/ListingDetailsPage'
import MarketplacePage from './pages/MarketplacePage'
import NotFoundPage from './pages/NotFoundPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
import AuthPage from './pages/AuthPage'
import { useApp } from './context/AppContext'

function Authenticated({ children }) {
  const { user } = useApp()
  const location = useLocation()
  return user ? children : <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace/>
}

export default function App() {
  return <BrowserRouter><Routes><Route element={<SiteLayout/>}>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/marketplace" element={<Authenticated><MarketplacePage/></Authenticated>}/>
    <Route path="/listings/:id" element={<Authenticated><ListingDetailsPage/></Authenticated>}/>
    <Route path="/seller" element={<SellerDashboardPage/>}/>
    <Route path="/create-listing" element={<CreateListingPage/>}/>
    <Route path="/buyer" element={<BuyerDashboardPage/>}/>
    <Route path="/payments" element={<Navigate to="/buyer" replace/>}/>
    <Route path="/admin" element={<AdminDashboardPage/>}/>
    <Route path="/login" element={<AuthPage/>}/>
    <Route path="/register" element={<AuthPage register/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Route></Routes></BrowserRouter>
}
