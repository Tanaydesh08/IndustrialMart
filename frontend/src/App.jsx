import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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
import PaymentsPage from './pages/PaymentsPage'
import { useApp } from './context/AppContext'

function Authenticated({ children }) {
  const { user } = useApp()
  return user ? children : <Navigate to="/" replace/>
}

export default function App() {
  return <BrowserRouter><Routes><Route element={<SiteLayout/>}>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/marketplace" element={<Authenticated><MarketplacePage/></Authenticated>}/>
    <Route path="/listings/:id" element={<Authenticated><ListingDetailsPage/></Authenticated>}/>
    <Route path="/seller" element={<SellerDashboardPage/>}/>
    <Route path="/create-listing" element={<CreateListingPage/>}/>
    <Route path="/buyer" element={<BuyerDashboardPage/>}/>
    <Route path="/payments" element={<Authenticated><PaymentsPage/></Authenticated>}/>
    <Route path="/admin" element={<AdminDashboardPage/>}/>
    <Route path="/login" element={<AuthPage/>}/>
    <Route path="/register" element={<AuthPage register/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Route></Routes></BrowserRouter>
}
