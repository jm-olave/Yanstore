import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import MainMenu from './Pages/MainMenu.jsx'
import FormLayout from './Layouts/FormLayout.jsx'
import CategoryForm from './Pages/CategoryForm.jsx'
import FinancialInformationForm from './Pages/FinancialInformationForm.jsx'
import Inventory from './Pages/Inventory.jsx'
import ProductForm from './Pages/ProductForm.jsx'
import SupplierForm from './Pages/SupplierForm.jsx'
import SalesHistory from './Pages/SalesHistory.jsx'
import { validateEnv, logEnvironmentInfo } from './utils/validateEnv.js'
import Statistics from './Pages/Statistics.jsx'
import ProfitAndLossPage from './Pages/ProfitAndLossPage.jsx' // Import the new page
import Event from './Pages/Event.jsx' // Import the Event page
import PageLayout from './Layouts/PageLayout.jsx'

// Validate environment variables are correctly set
validateEnv();

// Log environment information (only in development)
if (import.meta.env.MODE === 'development') {
  logEnvironmentInfo();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
     <Routes>
      <Route element={<PageLayout/>}>
        <Route index element={<MainMenu/>}/>
        <Route element={<FormLayout title={'ADD PRODUCT'}/>}>
          <Route path='add-product' element={<ProductForm/>}/>
        </Route>
        <Route element={<FormLayout title={'EDIT PRODUCT'}/>}>
          <Route path='edit-product/:productId' element={<ProductForm/>}/>
        </Route>
        <Route element={<FormLayout title={'CATEGORIES'}/>}>
          <Route path='categories' element={<CategoryForm/>}/>
        </Route>
        <Route element={<FormLayout title={'INVENTORY'}/>}>
          <Route path='inventory' element={<Inventory/>}/>
        </Route>
        <Route element={<FormLayout title={'SALES HISTORY'}/>}>
          <Route path='sales-history' element={<SalesHistory/>}/>
        </Route>
        <Route element={<FormLayout title={'FINANCIAL INFORMATION'}/>}>
          <Route path='add-financial-information/:productId' element={<FinancialInformationForm/>}/>
        </Route>
        <Route element={<FormLayout title={'SUPPLIERS'}/>}>
          <Route path='suppliers' element={<SupplierForm/>}/>
        </Route>
        <Route element={<FormLayout title={'STATISTICS'}/>}>
          <Route path='statistics' element={<Statistics/>}/>
        </Route>
        <Route element={<FormLayout title={'PROFIT & LOSS'}/>}>
          <Route path='profit-and-loss' element={<ProfitAndLossPage/>}/>
        </Route>
        <Route element={<FormLayout title={'EVENTS'}/>}>
          <Route path='events' element={<Event/>}/>
        </Route>
      </Route>
     </Routes>
    </BrowserRouter>
  </StrictMode>
)
