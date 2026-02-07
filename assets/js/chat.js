/* --- SGX USER CHAT SYSTEM --- */

// ၁။ CREDENTIALS & INITIALIZATION
const SUPABASE_URL = "https://labuecnbqufcljreilme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYnVlY25icXVmY2xqcmVpbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTU3OTUsImV4cCI6MjA4NTM5MTc5NX0.U2IW5-pYLTlqpxC1ToktWedyxHuyHQB9YnLa4wsZDBE";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let mySubscription = null;
const currentUID = localStorage.getItem('sgx_user_id');

// စတင်အလုပ်လုပ်မည့်နေရာ
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUID) {
        console.error("❌ User not logged in!");
        return;
    }
    initRealtimeSystem(currentUID);
});

// ၂။ REAL-TIME SYSTEM (Messages & Balance)
function initRealtimeSystem(uid) {
    console.log("🚀 Initializing Chat for:", uid);
    
    // စာဟောင်းများ အရင်ဆွဲတင်မယ်
    loadChatHistory(uid);

    if (mySubscription) db.removeChannel(mySubscription);

    mySubscription = db.channel(`user-room-${uid}`)
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `uid=eq.${uid}` }, 
            (payload) => {
                const msg = payload.new;
                // Admin ဆီကလာတဲ့စာတွေကိုပဲ UI မှာ ထပ်ပြမယ် (ကိုယ့်စာက ပို့ကတည်းက ပြပြီးသားမို့)
                if (msg.is_admin) {
                    msg.type === 'image' ? renderImageMessage(msg.content, 'left') : renderTextMessage(msg.content, 'left');
                }
            }
        )
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, 
            (payload) => {
                // Balance Update ဖြစ်ရင် ချက်ချင်းပြောင်းမယ်
                const newBal = payload.new.content.balance;
                updateBalanceUI(newBal);
            }
        )
        .subscribe();
}

// ၃။ HISTORY LOADER
async function loadChatHistory(uid) {
    const { data, error } = await db.from('messages')
        .select('*')
        .eq('uid', uid)
        .order('created_at', { ascending: true });

    if (error) return console.error("Error loading history:", error);

    const display = document.getElementById('chat-display');
    if (display && data) {
        display.innerHTML = ""; 
        data.forEach(msg => {
            const side = msg.is_admin ? 'left' : 'right';
            msg.type === 'image' ? renderImageMessage(msg.content, side) : renderTextMessage(msg.content, side);
        });
        scrollChatToBottom();
    }
}

// ၄။ SEND MESSAGE LOGIC
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();

    if (text !== "" && currentUID) {
        // Optimistic UI: UI မှာ အရင်ပြမယ်
        renderTextMessage(text, 'right');
        input.value = ""; 
        scrollChatToBottom();

        // Database သို့ ပို့မယ်
        await db.from('messages').insert([
            { uid: currentUID, content: text, type: 'text', is_admin: false }
        ]);
    }
}

// ၅။ IMAGE UPLOAD LOGIC
function triggerImageUpload() {
    document.getElementById('image-upload-input').click();
}

async function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file || !currentUID) return;

    if (!file.type.startsWith('image/')) {
        alert("Please select an image file!");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageUrl = e.target.result;

        // Optimistic UI: UI မှာ ပုံ အရင်ပြမယ်
        renderImageMessage(imageUrl, 'right');
        scrollChatToBottom();

        // Database သို့ ပို့မယ်
        await db.from('messages').insert([
            { uid: currentUID, content: imageUrl, type: 'image', is_admin: false }
        ]);
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
}

// ၆။ UI HELPER FUNCTIONS
function renderTextMessage(text, side) {
    const display = document.getElementById('chat-display');
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${side}`;
    msgDiv.innerText = text;
    display.appendChild(msgDiv);
}

function renderImageMessage(url, side) {
    const display = document.getElementById('chat-display');
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${side}`;
    const img = document.createElement('img');
    img.src = url;
    img.className = 'chat-image';
    msgDiv.appendChild(img);
    display.appendChild(msgDiv);
}

function updateBalanceUI(amount) {
    const balEl = document.getElementById('user-balance');
    if (balEl) {
        balEl.innerText = `$${parseFloat(amount).toFixed(2)}`;
        balEl.classList.add('balance-highlight'); // Flash animation ပေးချင်ရင်သုံးရန်
        setTimeout(() => balEl.classList.remove('balance-highlight'), 500);
    }
}

function scrollChatToBottom() {
    const display = document.getElementById('chat-display');
    if (display) {
        display.scrollTop = display.scrollHeight;
    }
}