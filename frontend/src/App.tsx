import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BrowseLogsPage from './pages/BrowseLogsPage';
import { PublicRoute } from './components/PublicRoute';
import LoginPage from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';
import BrowseUsersPage from './pages/BrowseUsersPage';
import MainLayout from './layouts/MainLayout';





function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route element={<MainLayout/>}>
      <Route path="/logs" element={<PrivateRoute><BrowseLogsPage/></PrivateRoute>}/>
      <Route path='/users' element={<PrivateRoute><BrowseUsersPage/></PrivateRoute>}/>
      </Route>
      <Route path="*" element={<LoginPage/>}/>
      <Route path="/login" element={<LoginPage/>}/>
    </Routes>
    </BrowserRouter>
  )
}



export default App;
