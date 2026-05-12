import { createBrowserRouter, Navigate } from "react-router";
import { HomeRedirect } from "@/routes/HomeRedirect";
import { LoginPage } from "@/routes/LoginPage";
import { UnauthorizedPage } from "@/routes/UnauthorizedPage";
import { AdminLayout } from "@/routes/admin/AdminLayout";
import { UsersListPage } from "@/routes/admin/UsersListPage";
import { UserCreatePage } from "@/routes/admin/UserCreatePage";
import { UserEditPage } from "@/routes/admin/UserEditPage";
import { PimLayout } from "@/routes/pim/PimLayout";
import { PimDashboard } from "@/routes/pim/PimDashboard";
import { ProductsListPage } from "@/routes/pim/ProductsListPage";
import { ProductCreatePage } from "@/routes/pim/ProductCreatePage";
import { ProductEditPage } from "@/routes/pim/ProductEditPage";
import { PricingLayout } from "@/routes/pricing/PricingLayout";
import { PricingDashboard } from "@/routes/pricing/PricingDashboard";
import { PricingProductsPage } from "@/routes/pricing/PricingProductsPage";
import { PromotionsPage } from "@/routes/pricing/PromotionsPage";
import { StockPage } from "@/routes/pricing/StockPage";
import { OrdersLayout } from "@/routes/orders/OrdersLayout";
import { OrdersDashboard } from "@/routes/orders/OrdersDashboard";
import { OrdersListPage } from "@/routes/orders/OrdersListPage";
import { OrderCreatePage } from "@/routes/orders/OrderCreatePage";
import { OrderDetailPage } from "@/routes/orders/OrderDetailPage";
import { RequireRole } from "@/components/auth/RequireRole";

export const router = createBrowserRouter([
  { path: "/", element: <HomeRedirect /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/admin",
    element: (
      <RequireRole roles={["admin"]}>
        <AdminLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <Navigate to="users" replace /> },
      { path: "users", element: <UsersListPage /> },
      { path: "users/new", element: <UserCreatePage /> },
      { path: "users/:id", element: <UserEditPage /> },
    ],
  },
  {
    path: "/pim",
    element: (
      <RequireRole roles={["PIM"]}>
        <PimLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <PimDashboard /> },
      { path: "products", element: <ProductsListPage /> },
      { path: "products/new", element: <ProductCreatePage /> },
      { path: "products/:id", element: <ProductEditPage /> },
    ],
  },
  {
    path: "/pricing",
    element: (
      <RequireRole roles={["PRICING"]}>
        <PricingLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <PricingDashboard /> },
      { path: "products", element: <PricingProductsPage /> },
      { path: "promotions", element: <PromotionsPage /> },
      { path: "stock", element: <StockPage /> },
    ],
  },
  {
    path: "/orders",
    element: (
      <RequireRole roles={["ORDER_MANAGEMENT"]}>
        <OrdersLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <OrdersDashboard /> },
      { path: "list", element: <OrdersListPage /> },
      { path: "list/:id", element: <OrderDetailPage /> },
      { path: "new", element: <OrderCreatePage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
