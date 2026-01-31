const SUPABASE_URL = "https://labuecnbqufcljreilme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYnVlY25icXVmY2xqcmVpbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTU3OTUsImV4cCI6MjA4NTM5MTc5NX0.U2IW5-pYLTlqpxC1ToktWedyxHuyHQB9YnLa4wsZDBE";
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAccess() {
    const { data: { session } } = await db.auth.getSession();
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');

    if (!session && !isAuthPage) {
        window.location.href = 'login.html';
    } else if (session && isAuthPage) {
        window.location.href = 'index.html';
    }
}
checkAccess();