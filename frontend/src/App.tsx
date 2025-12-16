import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BrowseLogsPage from './pages/BrowseLogsPage';
import { PublicRoute } from './components/PublicRoute';
import LoginPage from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';
import BrowseUsersPage from './pages/BrowseUsersPage';
import MainLayout from './layouts/MainLayout';
import { useAuth } from './components/useAuth';
import AddUserPage from './pages/AddUserPage';





function App() {

  const {user,loading} = useAuth();
  return (
    <BrowserRouter>
    <Routes>
      <Route element={<MainLayout/>}>
      <Route path="/logs" element={<PrivateRoute><BrowseLogsPage/></PrivateRoute>}/>
      <Route path="/users/new" element={<PrivateRoute><AddUserPage/></PrivateRoute>}/>
      <Route path='/users' element={<PrivateRoute><BrowseUsersPage/></PrivateRoute>}/>
      
      </Route>
      <Route path="*" element={<LoginPage/>}/>
      <Route path="/login" element={<LoginPage/>}/>
    </Routes>
    </BrowserRouter>
  )
}



export default App;
