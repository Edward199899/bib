// assets/js/core.js

// ၁။ Supabase ချိတ်ဆက်မှု (New Project Credentials)
const supabaseUrl = 'https://wanhwmcgvcmeqstkfukf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhbmh3bWNndmNtZXFzdGtmdWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjgzODQsImV4cCI6MjA4NjA0NDM4NH0.jMVn9KRZ0U1XlgpzDrhcLAj55Dm9wK1V_XzfqBIkOrA';

const db = supabase.createClient(supabaseUrl, supabaseKey);

console.log("✅ New Connection Established via core.js");

// ၂။ Helper Functions (Login စစ်ဆေးရန်)
async function checkAccess() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
        // Login မဝင်ရသေးရင် Login စာမျက်နှာကို မောင်းထုတ်မယ်
        window.location.href = 'blog-grid.html';
    }
}