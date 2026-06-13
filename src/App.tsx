import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Toast from "@/components/Toast";
import Home from "@/pages/Home";
import DispatcherBoard from "@/pages/DispatcherBoard";
import NewTaskPage from "@/pages/NewTaskPage";
import TaskDetailPage from "@/pages/TaskDetailPage";
import DriverTaskList from "@/pages/DriverTaskList";
import DriverTaskWorkflow from "@/pages/DriverTaskWorkflow";
import AdminDashboard from "@/pages/AdminDashboard";
import CongestionPage from "@/pages/CongestionPage";

export default function App() {
  return (
    <Router>
      <Toast />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dispatcher"
          element={
            <AppLayout>
              <DispatcherBoard />
            </AppLayout>
          }
        />
        <Route
          path="/dispatcher/task/new"
          element={
            <AppLayout>
              <NewTaskPage />
            </AppLayout>
          }
        />
        <Route
          path="/dispatcher/task/:id"
          element={
            <AppLayout>
              <TaskDetailPage />
            </AppLayout>
          }
        />
        <Route
          path="/driver"
          element={
            <AppLayout>
              <DriverTaskList />
            </AppLayout>
          }
        />
        <Route
          path="/driver/task/:id"
          element={
            <AppLayout>
              <DriverTaskWorkflow />
            </AppLayout>
          }
        />
        <Route
          path="/admin"
          element={
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/admin/congestion"
          element={
            <AppLayout>
              <CongestionPage />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}
