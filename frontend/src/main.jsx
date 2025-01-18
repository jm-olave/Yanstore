import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import App from './App.jsx'
import MainMenu from './Pages/MainMenu.jsx'
import FormLayout from './Layouts/FormLayout.jsx'
import CategoryForm from './Pages/CategoryForm.jsx'
import FinancialInformationForm from './Pages/FinancialInformationForm.jsx'
import Inventory from './Pages/Inventory.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
     <Routes>
      <Route index element={<MainMenu/>}/>
      <Route element={<FormLayout/>}>
        <Route path='add-category' element={<CategoryForm/>}/>
        <Route path='add-financial-information' element={<FinancialInformationForm/>}/>
        <Route path='inventory' element={<Inventory/>}/>
      </Route>
     </Routes>
    </BrowserRouter>
  </StrictMode>,
)
