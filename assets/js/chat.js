// chat.js
const supabaseUrl = 'https://labuecnbqufcljreilme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYnVlY25icXVmY2xqcmVpbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTU3OTUsImV4cCI6MjA4NTM5MTc5NX0.U2IW5-pYLTlqpxC1ToktWedyxHuyHQB9YnLa4wsZDBE';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ... အောက်က ကျန်တဲ့ ကုဒ်တွေက အတူတူပဲ ...

// 2. DOM Elements (HTML ID တွေနဲ့ ကိုက်ညီပါစေ)
const messagesContainer = document.getElementById('chat-messages-container');
const messageInput = document.getElementById('user-msg-input');
const sendBtn = document.getElementById('send-msg-btn');
let currentUserID = null;

// 3. စာစတင်ချိန်မှာ User ကို စစ်ဆေးခြင်း & Realtime ချိတ်ခြင်း
async function initChat() {
    // Login ဝင်ထားတဲ့ User ID ကို ယူမယ်
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        console.log("User not logged in");
        return; 
    }
    
    currentUserID = user.id;
    console.log("Chatting as User:", currentUserID);

    // အရင်ပြောထားတဲ့ စာအဟောင်းတွေကို ဆွဲထုတ်မယ်
    loadOldMessages();

    // Realtime: ကိုယ့်ဆီလာတဲ့ စာမှန်သမျှ နားထောင်မယ်
    supabase
        .channel('public:messages')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `uid=eq.${currentUserID}` // ကိုယ့် ID နဲ့ဆိုင်မှ ပြမယ်
            }, 
            payload => {
                displayMessage(payload.new);
            }
        )
        .subscribe();
}

// 4. စာပို့မည့် Function
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUserID) return;

    const { error } = await supabase
        .from('messages') // Table Name
        .insert([{ 
            uid: currentUserID,   // User ID
            content: text,        // Message Content
            type: 'text',
            is_admin: false       // User ပို့တာမို့လို့ False
        }]);

    if (!error) {
        messageInput.value = ''; // Box ကိုရှင်းမယ်
    } else {
        console.error("Sending error:", error);
    }
}

// 5. Message အဟောင်းများ ပြန်ခေါ်ခြင်း
async function loadOldMessages() {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('uid', currentUserID) // ကိုယ့်စာတွေပဲ ယူမယ်
        .order('created_at', { ascending: true });

    if (data) {
        data.forEach(msg => displayMessage(msg));
    }
}

// 6. UI ပေါ်တွင် ပြခြင်း Logic
function displayMessage(data) {
    // is_admin FALSE ဆိုရင် ကိုယ်ပို့တာ (Sent)
    // is_admin TRUE ဆိုရင် Admin ပို့တာ (Received)
    const isSent = !data.is_admin; 

    const row = document.createElement('div');
    row.className = `message-row ${isSent ? 'sent' : 'received'}`;
    
    const timeString = new Date(data.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    row.innerHTML = `
        ${!isSent ? `<img src="assets/media/support_icons/support_bot.png" class="avatar">` : ''}
        <div>
            <div class="bubble">${data.content}</div>
            <span class="time">${timeString}</span>
        </div>
        ${isSent ? `<img src="assets/media/support_icons/user.svg" class="avatar">` : ''}
    `;
    
    messagesContainer.appendChild(row);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

// Start
initChat();