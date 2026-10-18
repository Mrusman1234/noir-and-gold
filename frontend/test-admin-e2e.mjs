// Comprehensive E2E test for Admin Authentication, Protected APIs, and Order Management
const baseUrl = "http://localhost:3000";
const adminEmail = process.env.ADMIN_EMAIL || "";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const canTestValidLogin = Boolean(adminEmail && adminPassword);
let passed = 0;
let total = 0;

function assert(desc, condition) {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${desc}`);
  }
}

async function run() {
  console.log("--- Starting Admin Authentication & Dashboard Verification ---");

  // 1. Invalid login test
  const invRes = await fetch(`${baseUrl}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: adminEmail || "admin@example.com",
      password: "WrongPassword123!",
    }),
  });
  assert("Invalid login returns HTTP 401", invRes.status === 401);
  const invData = await invRes.json();
  assert(
    "Invalid login returns error description",
    invData?.error?.message === "Invalid email or password."
  );

  // 2. Unauthenticated access check on protected routes
  const unauthMe = await fetch(`${baseUrl}/api/v1/admin/auth/me`);
  assert("Unauthenticated /auth/me returns HTTP 401", unauthMe.status === 401);

  const unauthAnalytics = await fetch(`${baseUrl}/api/v1/admin/analytics`);
  assert("Unauthenticated /analytics returns HTTP 401", unauthAnalytics.status === 401);

  const unauthOrders = await fetch(`${baseUrl}/api/v1/admin/orders`);
  assert("Unauthenticated /orders returns HTTP 401", unauthOrders.status === 401);

  if (!canTestValidLogin) {
    console.log("SKIP: set ADMIN_EMAIL and ADMIN_PASSWORD to run the authenticated checks.");
    console.log(`\nTEST SUMMARY: ${passed} of ${total} tests PASSED (authenticated checks skipped)!`);
    return;
  }

  // 3. Valid admin login
  const loginRes = await fetch(`${baseUrl}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  });
  assert("Valid admin login returns HTTP 200", loginRes.status === 200);
  const loginData = await loginRes.json();
  assert("Login returns user role ADMIN", loginData.user?.role === "ADMIN");

  const rawCookie = loginRes.headers.get("set-cookie");
  assert(
    "Login response sets secure session cookie",
    Boolean(rawCookie && rawCookie.includes("noir_admin_session"))
  );
  const cookieHeader = rawCookie ? rawCookie.split(";")[0] : "";

  // 4. Verify session with cookie
  const meRes = await fetch(`${baseUrl}/api/v1/admin/auth/me`, {
    headers: { Cookie: cookieHeader },
  });
  assert("Authenticated /auth/me returns HTTP 200", meRes.status === 200);
  const meData = await meRes.json();
  assert("Authenticated user has the ADMIN role", meData.user?.role === "ADMIN");

  // 5. Verify analytics
  const analyticsRes = await fetch(`${baseUrl}/api/v1/admin/analytics`, {
    headers: { Cookie: cookieHeader },
  });
  assert("Authenticated /analytics returns HTTP 200", analyticsRes.status === 200);
  const analyticsData = await analyticsRes.json();
  assert(
    "Analytics returns positive order count",
    analyticsData.metrics?.totalOrders > 0
  );
  assert(
    "Collected revenue is tracked",
    typeof analyticsData.metrics?.totalCollectedRevenuePkr === "number"
  );

  // 6. Verify orders list
  const ordersRes = await fetch(`${baseUrl}/api/v1/admin/orders`, {
    headers: { Cookie: cookieHeader },
  });
  assert("Authenticated /orders returns HTTP 200", ordersRes.status === 200);
  const ordersData = await ordersRes.json();
  assert("Orders list contains items", ordersData.orders?.length > 0);

  // 7. Verify inventory
  const inventoryApiRes = await fetch(`${baseUrl}/api/v1/admin/inventory`, {
    headers: { Cookie: cookieHeader },
  });
  assert("Authenticated /inventory returns HTTP 200", inventoryApiRes.status === 200);

  // 8. Verify categories
  const catRes = await fetch(`${baseUrl}/api/v1/admin/categories`, {
    headers: { Cookie: cookieHeader },
  });
  assert("Authenticated /categories returns HTTP 200", catRes.status === 200);

  // 9. Verify page routes render status 200
  const adminPageRes = await fetch(`${baseUrl}/admin`);
  assert("/admin page renders HTTP 200", adminPageRes.status === 200);

  const adminDashRes = await fetch(`${baseUrl}/admin/dashboard`);
  assert("/admin/dashboard page renders HTTP 200", adminDashRes.status === 200);

  const ordersPageRes = await fetch(`${baseUrl}/admin/orders`);
  assert("/admin/orders page renders HTTP 200", ordersPageRes.status === 200);

  const productsPageRes = await fetch(`${baseUrl}/admin/products`);
  assert("/admin/products page renders HTTP 200", productsPageRes.status === 200);

  const inventoryPageRes = await fetch(`${baseUrl}/admin/inventory`);
  assert("/admin/inventory page renders HTTP 200", inventoryPageRes.status === 200);

  const categoriesPageRes = await fetch(`${baseUrl}/admin/categories`);
  assert("/admin/categories page renders HTTP 200", categoriesPageRes.status === 200);

  // 10. Logout and confirm invalidation
  const logoutRes = await fetch(`${baseUrl}/api/v1/admin/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });
  assert("Logout returns HTTP 200", logoutRes.status === 200);

  const meAfterLogout = await fetch(`${baseUrl}/api/v1/admin/auth/me`, {
    headers: { Cookie: cookieHeader },
  });
  assert(
    "After logout, session token is invalidated (HTTP 401)",
    meAfterLogout.status === 401
  );

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} of ${total} tests PASSED!`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
