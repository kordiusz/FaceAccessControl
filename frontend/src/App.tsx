import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BrowseLogsPage from './pages/BrowseLogsPage';
import { PublicRoute } from './components/PublicRoute';
import LoginPage from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';
import BrowseUsersPage from './pages/BrowseUsersPage';





function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/logs" element={<PrivateRoute><BrowseLogsPage/></PrivateRoute>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path='/users' element={<PrivateRoute><BrowseUsersPage/></PrivateRoute>}/>
      <Route path="*" element={<LoginPage/>}/>
      
    </Routes>
    </BrowserRouter>
  )
}



export default App;
