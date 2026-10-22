import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAdmin() {
    const location = useLocation();

    // Adapt these keys to your existing authentication implementation.
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    if (user.role !== "ADMIN") {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}