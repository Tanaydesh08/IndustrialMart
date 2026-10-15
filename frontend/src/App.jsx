import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import BuyerDashboardPage from './pages/BuyerDashboardPage'
import CreateListingPage from './pages/CreateListingPage'
import HomePage from './pages/HomePage'
import ListingDetailsPage from './pages/ListingDetailsPage'
import MarketplacePage from './pages/MarketplacePage'
import NotFoundPage from './pages/NotFoundPage'
import SellerDashboardPage from './pages/SellerDashboardPage'

export default function App() {
  return <BrowserRouter><Routes><Route element={<SiteLayout/>}>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/marketplace" element={<MarketplacePage/>}/>
    <Route path="/listings/:id" element={<ListingDetailsPage/>}/>
    <Route path="/seller" element={<SellerDashboardPage/>}/>
    <Route path="/create-listing" element={<CreateListingPage/>}/>
    <Route path="/buyer" element={<BuyerDashboardPage/>}/>
    <Route path="/admin" element={<AdminDashboardPage/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Route></Routes></BrowserRouter>
}
