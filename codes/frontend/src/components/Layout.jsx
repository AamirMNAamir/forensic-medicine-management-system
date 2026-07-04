import './Layout.css';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ title, breadcrumb, children }) {
  return (
    <div className="app-wrapper">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} breadcrumb={breadcrumb} />
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}
