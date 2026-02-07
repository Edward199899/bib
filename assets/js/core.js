// assets/js/core.js

// ၁။ Supabase ချိတ်ဆက်မှု
const supabaseUrl = "https://wanhwmcgvcmeqstkfukf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhbmh3bWNndmNtZXFzdGtmdWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjgzODQsImV4cCI6MjA4NjA0NDM4NH0.jMVn9KRZ0U1XlgpzDrhcLAj55Dm9wK1V_XzfqBIkOrA";

const db = supabase.createClient(supabaseUrl, supabaseKey);

console.log("✅ New Project Core Connected");

// ၂။ Helper Functions (Login စစ်ဆေးရန်)
async function checkAccess() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
        window.location.href = 'login.html'; // Login မဝင်ရသေးရင် မောင်းထုတ်မယ်
    }
}