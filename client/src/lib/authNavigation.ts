export type AuthNavigationUser = {
  role?: string | null;
};

export function getPostLoginPath(
  user: AuthNavigationUser | null | undefined,
  currentPath: string
) {
  if (user?.role === "superadmin" || user?.role === "admin") {
    return "/admin";
  }

  if (user?.role === "hotel_owner") {
    return "/hotel-dashboard";
  }

  return currentPath;
}
