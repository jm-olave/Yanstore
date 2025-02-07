import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import MainMenu from './Pages/MainMenu.jsx'
import FormLayout from './Layouts/FormLayout.jsx'
import CategoryForm from './Pages/CategoryForm.jsx'
import FinancialInformationForm from './Pages/FinancialInformationForm.jsx'
import Inventory from './Pages/Inventory.jsx'
import ProductForm from './Pages/ProductForm.jsx'
import DebtorForm from './Pages/DebtorForm.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
     <Routes>
      <Route index element={<MainMenu/>}/>
      <Route element={<FormLayout title={'ADD PRODUCT'}/>}>
        <Route path='add-product' element={<ProductForm/>}/>
      </Route>
      <Route element={<FormLayout title={'ADD CATEGORY'}/>}>
        <Route path='add-category' element={<CategoryForm/>}/>
      </Route>
      <Route element={<FormLayout title={'INVENTORY'}/>}>
        <Route path='inventory' element={<Inventory/>}/>
      </Route>
      <Route element={<FormLayout title={'FINANCIAL INFORMATION'}/>}>
        <Route path='add-financial-information' element={<FinancialInformationForm/>}/>
      </Route>
      <Route element={<FormLayout title={'DEBTORS'}/>}>
        <Route path='add-debtor' element={<DebtorForm/>}/>
      </Route>
     </Routes>
    </BrowserRouter>
  </StrictMode>,
)
