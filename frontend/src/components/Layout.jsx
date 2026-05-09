import { styles } from '../assets/dummyStyles'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom'

const Layout = ({ onLogout, user }) => {
  return (
    <div className={styles.layout.root}>
      <Navbar user={user} onLogout={onLogout} />
      <Outlet />
    </div>
  )
}

export default Layout

