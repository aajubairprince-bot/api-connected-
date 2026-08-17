let currentChatId = null;

// গ্লোবাল ভয়েস এবং মাইক্রোফোন কন্ট্রোল ভেরিয়েবল
let activeTtsButton = null; 
let recognition = null;
window.currentAudio = null;

// অ্যাপ লোড হওয়ার মূল ইনিশিয়ালাইজার
async function initApp() {
    await refreshSidebar();
    displayRandomAffirmation(); 
    switchDietTab(1);                                   
    renderDailyRoutine(); 
    
    let firstItem = document.querySelector('.history-item');
    if (firstItem) {
        firstItem.click();
    } else {
        createNewChat();
    }
}

// 🆕 Daily Routine Checklist
const routineItems = [
    "Morning Vitamin / Folic Acid",
    "Light Stretching / Walk (15-20 min)",
    "Drink at least 3 Liters of Water",
    "Afternoon Rest / Short Nap",
    "Count Baby Kicks",
    "Evening Medicine / Calcium & Iron"
];

function renderDailyRoutine() {
    let routineBox = document.getElementById("routineBox");
    if (!routineBox) return;

    routineBox.innerHTML = `
        <h3><i class="fa-solid fa-square-check"></i> Daily Routine Tracker</h3>
        <div class="checklist-container" id="routineChecklistContainer"></div>
    `;

    let container = document.getElementById("routineChecklistContainer");
    routineItems.forEach((item, index) => {
        let label = document.createElement("label");
        label.className = "check-item";
        label.innerHTML = `<input type="checkbox" id="routine_item_${index}"> ${item}`;
        container.appendChild(label);
    });
}

// 🆕 Daily Meal & Nutrition Logger
function logDailyMeal() {
    let mealTypeSelect = document.getElementById("mealTypeSelect");
    let mealDescInput = document.getElementById("mealDescInput");
    let logBox = document.getElementById("dietLogBox");

    if (!mealTypeSelect || !mealDescInput || !logBox) return;

    let mealType = mealTypeSelect.value;
    let mealDesc = mealDescInput.value.trim();

    if (mealDesc === "") return;

    let timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let logItem = document.createElement("div");
    logItem.className = "log-item";
    logItem.style.borderLeftColor = "#10b981";
    logItem.innerHTML = `<span><strong>${mealType}:</strong> ${mealDesc} (at ${timeStr})</span> <i class="fa-solid fa-apple-whole" style="color: #10b981;"></i>`;
    
    logBox.insertBefore(logItem, logBox.firstChild);
    mealDescInput.value = "";
}

// 🆕 Mood & Symptom Tracker
function logMood(moodText) {
    let logBox = document.getElementById("moodLogBox");
    if (!logBox) return;
    let timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    let logItem = document.createElement("div");
    logItem.className = "log-item";
    logItem.style.borderLeftColor = "#ec4899";
    logItem.innerHTML = `<span>Today: ${moodText} (at ${timeStr})</span> <i class="fa-solid fa-heart" style="color: #ec4899;"></i>`;
    logBox.insertBefore(logItem, logBox.firstChild);
}

function toggleSymptom(symptomName, id) {
    let tag = document.getElementById(id);
    if (!tag) return;
    tag.classList.toggle("active");
    if(tag.classList.contains("active")) {
        let logBox = document.getElementById("moodLogBox");
        if (!logBox) return;
        let logItem = document.createElement("div");
        logItem.className = "log-item";
        logItem.style.borderLeftColor = "#e11d48";
        logItem.innerHTML = `<span>Logged: ${symptomName}</span> <i class="fa-solid fa-hand-holding-hand" style="color: #e11d48;"></i>`;
        logBox.insertBefore(logItem, logBox.firstChild);
    }
}

// 🆕 Doctor Appointment Scheduler
function saveAppointment() {
    let docNameInput = document.getElementById("docNameInput");
    let appTimeInput = document.getElementById("appTimeInput");
    let logBox = document.getElementById("appLogBox");

    if (!docNameInput || !appTimeInput || !logBox) return;

    let docName = docNameInput.value.trim();
    let appTime = appTimeInput.value;

    if(!docName || !appTime) return;

    let dateObj = new Date(appTime);
    let formattedDate = dateObj.toLocaleDateString([], {month: 'short', day: 'numeric'}) + " at " + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    let logItem = document.createElement("div");
    logItem.className = "log-item";
    logItem.style.borderLeftColor = "#8b5cf6";
    logItem.innerHTML = `<span>🩺 ${docName} - ${formattedDate}</span> <i class="fa-solid fa-bell" style="color: #8b5cf6;"></i>`;
    logBox.insertBefore(logItem, logBox.firstChild);

    docNameInput.value = "";
    appTimeInput.value = "";
    alert(`📅 Appointment scheduled with ${docName}!`);
}

// 🆕 Baby Name Shortlist
function addBabyName() {
    let nameField = document.getElementById("babyNameInput");
    let nameListBox = document.getElementById("nameListBox");

    if (!nameField || !nameListBox) return;
    let nameText = nameField.value.trim();

    if(nameText === "") return;

    let item = document.createElement("div");
    item.className = "name-item";
    item.innerHTML = `<span>👶 ${nameText}</span> <i class="fa-solid fa-star" style="color: #eab308; cursor: pointer;" onclick="this.parentElement.remove()"></i>`;
    nameListBox.appendChild(item);
    nameField.value = "";
}

// মানসিক প্রশান্তির বাণী
const affirmations = [
    "আপু, আপনার শরীরের ভেতরে একটি চমৎকার নতুন প্রাণের সৃষ্টি হচ্ছে। আপনি অসাধারণ!",
    "প্রতিটি নতুন দিন আপনাকে আপনার সোনামণির আরও কাছে নিয়ে আসছে। নিজের যত্ন নিন।",
    "আপনার শরীর শক্তিশালী এবং এটি একটি সুন্দর অলৌকিক ঘটনা ঘটাতে পুরোপুরি সক্ষম।",
    "সব চিন্তা দূরে রাখুন, আপনার ছোট্ট সোনাটি আপনার গর্ভে একদম নিরাপদ ও শান্তিতে আছে।",
    "একটি সুস্থ ও হাসিখুশি মা-ই পারে একটি সুস্থ ও সুন্দর সন্তান উপহার দিতে। সবসময় হাসুন!"
];

function displayRandomAffirmation() {
    let textElement = document.getElementById("quoteText");
    if (textElement) {
        let randomIndex = Math.floor(Math.random() * affirmations.length);
        textElement.innerText = affirmations[randomIndex];
    }
}

// ট্রাইমেস্টার ডায়েট প্ল্যান
const dietData = {
    1: "🟢 <strong>১ম ট্রাইমেস্টার (১-১২ সপ্তাহ):</strong><br>• ফলিক অ্যাসিড সমৃদ্ধ খাবার (সবুজ শাকসবজি, ডাল) বেশি খান।<br>• বমি ভাব কমাতে আদা চা বা শুকনো মুড়ি খেতে পারেন।<br>• প্রচুর পানি ও তরল খাবার গ্রহণ করুন।",
    2: "🟡 <strong>২য় ট্রাইমেস্টার (১৩-২৬ সপ্তাহ):</strong><br>• ক্যালসিয়াম ও আয়রন (দুধ, ডিম, ছোট মাছ, কলা) বাড়ানো জরুরি।<br>• বাচ্চার হাড়ের গঠনের জন্য প্রোটিন (মুরগির মাংস, ডাল) বেশি খান।<br>• কাঁচা পেঁপে ও আনারস এড়িয়ে চলুন।",
    3: "🔵 <strong>৩য় ট্রাইমেস্টার (২৭-৪০ সপ্তাহ):</strong><br>• কোষ্ঠকাঠিন্য দূর করতে আঁশযুক্ত খাবার (লাল চালের ভাত, ওটস, ফল) খান।<br>• এনার্জির জন্য অল্প অল্প করে বারবার পুষ্টিকর খাবার খান।<br>• অতিরিক্ত তেল, ঝাল ও বাইরের জাঙ্ক ফুড পুরোপুরি বাদ দিন।"
};

function switchDietTab(tabNum) {
    document.querySelectorAll('.diet-tab-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.getElementById("tab" + tabNum);
    if (activeBtn) activeBtn.classList.add('active');
    let contentBox = document.getElementById("dietContentBox");
    if (contentBox) contentBox.innerHTML = dietData[tabNum];
}

// 🌐 সাইডবার রিফ্রেশ (Flask API)
async function refreshSidebar() {
    let historyList = document.getElementById("historyList");
    if (!historyList) return;
    historyList.innerHTML = "";
    try {
        let response = await fetch('/api/get_all_sessions');
        let sessions = await response.json();
        
        sessions.forEach(session => {
            let item = document.createElement("div");
            item.className = "history-item";
            if (session.chat_id === currentChatId) item.className += " active";
            item.innerText = session.title;
            item.setAttribute("data-id", session.chat_id);
            item.onclick = async function() {
                document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                currentChatId = session.chat_id;
                await loadChatMessages(currentChatId);
            };
            historyList.appendChild(item);
        });
    } catch (e) { console.error("Error fetching sessions:", e); }
}

// 🌐 চ্যাট মেসেজ লোড (Flask API)
async function loadChatMessages(chatId) {
    let chatBox = document.getElementById("chatBox");
    if (!chatBox) return;
    chatBox.innerHTML = "";
    try {
        let response = await fetch(`/api/get_chat_messages/${chatId}`);
        let messages = await response.json();
        
        if(!messages || messages.length === 0) {
            chatBox.innerHTML = `<div class="bot-msg-box"><div class="bot-msg">Hello! I am PROVA AI. How can I help you today?</div></div>`;
            return;
        }
        messages.forEach(msg => {
            if (msg.role === 'user') appendUserMessageToUI(msg.content);
            else if (msg.role === 'assistant') appendBotMessageToUI(formatCleanText(msg.content));
        });
    } catch (e) { console.error("Error loading chat messages:", e); }
}

function createNewChat() {
    currentChatId = 'chat_' + Math.random().toString(36).substr(2, 9);
    let chatBox = document.getElementById("chatBox");
    if (chatBox) {
        chatBox.innerHTML = `<div class="bot-msg-box"><div class="bot-msg">Hello! I am PROVA AI. How can I help you today?</div></div>`;
    }
    
    let historyList = document.getElementById("historyList");
    let item = document.createElement("div");
    item.className = "history-item active";
    item.innerText = "New chat session...";
    item.setAttribute("data-id", currentChatId);
    
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    item.onclick = function() {
        document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        currentChatId = item.getAttribute("data-id");
        loadChatMessages(currentChatId);
    };
    if (historyList) historyList.insertBefore(item, historyList.firstChild);
}

async function sendChatMessage() {
    let inputField = document.getElementById("userInput");
    if (!inputField) return;
    let userText = inputField.value.trim();
    if (userText === "") return;
    
    appendUserMessageToUI(userText);
    inputField.value = "";
    
    let activeHistory = document.querySelector('.history-item.active');
    if (activeHistory && (activeHistory.innerText.includes("New chat") || activeHistory.innerText.includes("prova"))) {
        activeHistory.innerText = userText.length > 20 ? userText.substring(0, 20) + "..." : userText;
    }
    await getBotResponse(userText);
}

// 🎙️ মাইক্রোফোন ভয়েস রিকগনিশন
async function startVoiceRecognition() {
    let voiceBtn = document.getElementById("voiceBtn");
    let inputField = document.getElementById("userInput");
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("আপনার ব্রাউজারে ভয়েস টাইপিং সাপোর্ট করে না। দয়া করে Google Chrome ব্যবহার করুন।");
        return;
    }

    if (recognition) {
        recognition.stop();
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        if(voiceBtn) voiceBtn.style.color = "#ef4444"; 
        if(inputField) inputField.placeholder = "শুনছি আপু, বলুন...";
    };

    recognition.onresult = function(event) {
        const speechToText = event.results[0][0].transcript;
        if(speechToText.trim() !== "" && inputField) {
            inputField.value = speechToText;
            sendChatMessage(); 
        }
    };

    recognition.onerror = function(event) {
        console.error("Mic Error: ", event.error);
        alert("মাইক্রোফোনে সমস্যা হয়েছে। পারমিশন চেক করুন।");
    };

    recognition.onend = function() {
        if(voiceBtn) voiceBtn.style.color = "#94a3b8";
        if(inputField) inputField.placeholder = "Type a message or use tools...";
        recognition = null;
    };

    recognition.start();
}

function previewAndSendImage() {
    let fileInput = document.getElementById("imageInput");
    let chatBox = document.getElementById("chatBox");
    if (fileInput && fileInput.files && fileInput.files[0]) {
        let reader = new FileReader();
        reader.onload = async function(e) {
            let userDiv = document.createElement("div");
            userDiv.className = "user-msg";
            let img = document.createElement("img");
            img.src = e.target.result;
            img.className = "chat-img";
            userDiv.appendChild(document.createTextNode("Sent an image:"));
            userDiv.appendChild(img);
            if(chatBox) {
                chatBox.appendChild(userDiv);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
            await getBotResponse("I have uploaded an image regarding my pregnancy health. Please guide me.");
        }
        reader.readAsDataURL(fileInput.files[0]);
        fileInput.value = "";
    }
}

// 🔊 ব্যাকএন্ড API থেকে ফিমেল ভয়েস ফেচ করে প্লে করার ফাংশন
function readAloud(text, buttonElement) {
    if (activeTtsButton === buttonElement && window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
        resetTtsButton(buttonElement);
        return;
    }

    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
        if (activeTtsButton) resetTtsButton(activeTtsButton);
    }

    activeTtsButton = buttonElement;
    buttonElement.innerHTML = "<i class='fa-solid fa-square'></i> Stop";
    buttonElement.style.backgroundColor = "#ef4444"; 

    fetch('/api/speak', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.blob();
    })
    .then(blob => {
        let audioUrl = URL.createObjectURL(blob);
        let audio = new Audio(audioUrl);
        window.currentAudio = audio;

        audio.play().catch(error => {
            console.error("Audio Play Error:", error);
            alert("ভয়েস প্লে করতে সমস্যা হচ্ছে।");
            resetTtsButton(buttonElement);
        });

        audio.onended = function() {
            resetTtsButton(buttonElement);
        };
    })
    .catch(error => {
        console.error("TTS Fetch Error:", error);
        alert("সার্ভার থেকে ভয়েস জেনারেট করা যায়নি।");
        resetTtsButton(buttonElement);
    });
}

function resetTtsButton(btn) {
    if(btn) {
        btn.innerHTML = "<i class='fa-solid fa-volume-high'></i> Speak";
        btn.style.backgroundColor = ""; 
    }
    if (activeTtsButton === btn) activeTtsButton = null;
    window.currentAudio = null;
}

function formatCleanText(text) {
    if (!text) return "";
    let cleaned = text.replace(/\*\*(.*?)\*\*/g, "$1");
    cleaned = cleaned.replace(/^\s*\*\s*/gm, "• ");
    return cleaned;
}

function appendUserMessageToUI(text) {
    let chatBox = document.getElementById("chatBox");
    if(!chatBox) return;
    let userDiv = document.createElement("div");
    userDiv.className = "user-msg";
    userDiv.innerText = text;
    chatBox.appendChild(userDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendBotMessageToUI(cleanText) {
    let chatBox = document.getElementById("chatBox");
    if(!chatBox) return;
    let box = document.createElement("div");
    box.className = "bot-msg-box";
    let msgDiv = document.createElement("div");
    msgDiv.className = "bot-msg";
    msgDiv.innerText = cleanText;
    let ttsBtn = document.createElement("button");
    ttsBtn.className = "tts-btn";
    ttsBtn.innerHTML = "<i class='fa-solid fa-volume-high'></i> Speak";
    
    ttsBtn.onclick = function() { readAloud(cleanText, ttsBtn); };
    
    box.appendChild(msgDiv);
    box.appendChild(ttsBtn);
    chatBox.appendChild(box);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 🌐 AI রেসপন্স পাওয়ার জন্য Flask API কল
async function getBotResponse(promptText) {
    let chatBox = document.getElementById("chatBox");
    if (!chatBox) return;
    
    let loadingDiv = document.createElement("div");
    loadingDiv.className = "loading-msg";
    loadingDiv.id = "prova-loading";
    loadingDiv.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> PROVA AI is thinking...`;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    let selectedLang = 'bn';
    let langSelectElem = document.getElementById("langSelect") || document.getElementById("languageSelect");
    if (langSelectElem) {
        selectedLang = langSelectElem.value;
    } else if (typeof currentLang !== 'undefined') {
        selectedLang = currentLang;
    }

    try {
        let response = await fetch('/api/ask_prova_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: currentChatId,
                prompt_text: promptText,
                language: selectedLang
            })
        });

        let data = await response.json();
        let loading = document.getElementById("prova-loading");
        if (loading) loading.remove();

        appendBotMessageToUI(formatCleanText(data.reply));
        await refreshSidebar();
    } catch (error) {
        console.error("API Fetch Error:", error);
        let loading = document.getElementById("prova-loading");
        if (loading) loading.remove();
        appendBotMessageToUI("Sorry আপু, সার্ভারে সমস্যা হচ্ছে।");
    }
}

// বাচ্চার বৃদ্ধি ডেটাবেস
const babyDevelopmentData = {
    1: { stage: "Tiny Miracle (একটি একক কোষ)", emoji: "✨", detail: "সবেমাত্র আপনার শরীরে একটি সুন্দর প্রাণের স্পন্দন শুরু হয়েছে।" },
    4: { stage: "Tiny Dot (ছোট্ট একটি বিন্দু)", emoji: "📍", detail: "নাক, কান ও মুখের প্রাথমিক গঠন তৈরি হচ্ছে।" },
    8: { stage: "Tiny Heart Beats (স্পন্দিত হৃদপিণ্ড)", emoji: "💓", detail: "বাচ্চার ছোট্ট হৃদপিণ্ডটি এখন মিনিটে প্রায় ১৫০ বার স্পন্দিত হচ্ছে!" },
    12: { stage: "Tiny Fingernails (নরম নখ)", emoji: "👶", detail: "বাচ্চার আঙুলে এখন নরম নরম নখের রেখা দেখা যাচ্ছে!" },
    16: { stage: "Soft Lanugo (গায়ের নরম লোম)", emoji: "🍑", detail: "বাচ্চার ত্বক সুরক্ষার জন্য সারা গায়ে তুলতুলে নরম পশম গজাচ্ছে।" },
    20: { stage: "Baby's First Kicks (প্রথম মিষ্টি নড়াচড়া)", emoji: "👣", detail: "আপনি তার প্রথম মিষ্টি নড়াচড়া বা কিক টের পাচ্ছেন।" },
    24: { stage: "Sucking Thumb (বৃদ্ধাঙ্গুল চোষা)", emoji: "🍼", detail: "বাচ্চা এখন পেটের ভেতর নিজের বুড়ো আঙুল চুষতে শিখে গেছে!" },
    27: { stage: "Opening Eyes (চোখ মেলা)", emoji: "👀", detail: "বাবু এখন পেটের ভেতর চোখ মেলতে এবং বন্ধ করতে পারছে!" },
    28: { stage: "Sweet Hiccups (মিষ্টি হেঁচকি)", emoji: "🥰", detail: "বাচ্চা পেটে মাঝে মাঝে হালকা ছন্দময় হেঁচকি তোলে!" },
    32: { stage: "Dreaming Stage (স্বপ্নের রাজ্য)", emoji: "💤", detail: "ঘুমের ঘোরে সে এখন আমাদের মতোই স্বপ্ন দেখতে শুরু করেছে!" },
    36: { stage: "Baby's First Booties (বাচ্চার ছোট্ট মোজা)", emoji: "🧦", detail: "সে এখন মাথা নিচের দিকে ঘুরিয়ে পৃথিবীর আলোয় আসার জন্য প্রস্তুত।" },
    40: { stage: "Ready for Your Hugs (কোলে আসার অপেক্ষায়)", emoji: "🎁", detail: "আপনার দীর্ঘ নয় মাসের অপেক্ষার অবসান হতে চলেছে!" }
};

function calculatePregnancy() {
    let lmpInput = document.getElementById("lmpDate");
    if (!lmpInput || !lmpInput.value) return;
    let lmp = new Date(lmpInput.value);
    let today = new Date();
    if (lmp > today) {
        let calcResult = document.getElementById("calcResult");
        if(calcResult) calcResult.innerHTML = `<span style="color: #ef4444;">⚠️ Invalid date!</span>`;
        return;
    }
    let dueDate = new Date(lmp.getTime() + (280 * 24 * 60 * 60 * 1000));
    let diffDays = Math.ceil(Math.abs(today - lmp) / (1000 * 60 * 60 * 24));
    let weeks = Math.floor(diffDays / 7);
    let days = diffDays % 7;
    
    let trimester = weeks <= 12 ? "First Trimester" : weeks <= 26 ? "Second Trimester" : "Third Trimester";
    let calcResult = document.getElementById("calcResult");
    if(calcResult) {
        calcResult.innerHTML = `<strong>Due Date:</strong> ${dueDate.toDateString()}<br><strong>Progress:</strong> ${weeks} W, ${days} D<br><strong>${trimester}</strong>`;
    }
    
    let babyVisualizer = document.getElementById("babyVisualizer");
    if(babyVisualizer) babyVisualizer.style.display = "block";
    
    let matchedWeek = 1;
    Object.keys(babyDevelopmentData).map(Number).sort((a,b)=>a-b).forEach(w => { if(weeks>=w) matchedWeek=w; });
    let info = babyDevelopmentData[matchedWeek];
    
    let babyEmoji = document.getElementById("babyEmoji");
    let babyFruitName = document.getElementById("babyFruitName");
    let babyDetails = document.getElementById("babyDetails");

    if(babyEmoji) babyEmoji.innerText = info.emoji;
    if(babyFruitName) babyFruitName.innerText = `Week ${weeks}: ${info.stage}`;
    if(babyDetails) babyDetails.innerText = info.detail;
}

// BP & Weight Tracker
function logVitals() {
    let bpInput = document.getElementById("bpInput");
    let weightInput = document.getElementById("weightInput");
    let logBox = document.getElementById("vitalsLogBox");

    if(!bpInput || !weightInput || !logBox) return;

    let bp = bpInput.value.trim();
    let weight = weightInput.value.trim();
    
    if (!bp && !weight) return;
    let dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let logItem = document.createElement("div");
    logItem.className = "log-item";
    logItem.innerHTML = `<span>${dateStr} - 🩸 BP: ${bp||'N/A'} | ⚖️ ${weight||'N/A'} kg</span> <i class="fa-solid fa-check" style="color: #10b981;"></i>`;
    logBox.insertBefore(logItem, logBox.firstChild);
    bpInput.value = ""; 
    weightInput.value = "";
}

// রিমাইন্ডার ও বিবিধ
let waterIntervalId = null;
function toggleWaterReminder() {
    let btn = document.getElementById("waterBtn");
    let status = document.getElementById("waterTimerStatus");
    if (!btn || !status) return;

    if (waterIntervalId === null) {
        waterIntervalId = setInterval(() => { alert("🥤 আপু, পানি খাওয়ার সময় হয়েছে!"); }, 3600000);
        btn.innerText = "Stop Reminder"; btn.style.backgroundColor = "#ef4444";
        status.innerText = "Reminder is ON"; status.style.color = "#10b981";
    } else {
        clearInterval(waterIntervalId); waterIntervalId = null;
        btn.innerText = "Start (1 Hour)"; btn.style.backgroundColor = "#0ea5e9";
        status.innerText = "Reminder is OFF"; status.style.color = "#94a3b8";
    }
}

let kickCount = 0;
function countKick() { 
    kickCount++; 
    let display = document.getElementById("kickDisplay");
    if(display) display.innerText = kickCount + " Kicks"; 
}
function resetKick() { 
    kickCount = 0; 
    let display = document.getElementById("kickDisplay");
    if(display) display.innerText = "0 Kicks"; 
}

function toggleMusic() {
    let music = document.getElementById("bgMusic");
    let btn = document.getElementById("musicPlayBtn");
    if (!music || !btn) return;

    if (music.paused) { 
        music.play(); 
        btn.innerHTML = "<i class='fa-solid fa-pause'></i> Pause"; 
        btn.style.backgroundColor = "#ef4444"; 
    } else { 
        music.pause(); 
        btn.innerHTML = "<i class='fa-solid fa-play'></i> Play Music"; 
        btn.style.backgroundColor = "#10b981"; 
    }
}

function findNearbyHospitals() { window.open("https://www.google.com/maps/search/hospitals+near+me/", "_blank"); }

let medTimers = {};
function toggleMedReminder(id, name, timeSlot) {
    let btn = document.getElementById("medBtn" + id);
    if (!btn) return;

    if (!medTimers[id]) {
        medTimers[id] = true; btn.innerText = "Active"; btn.style.backgroundColor = "#ef4444";
        alert(`⏰ ${name} রিমাইন্ডার চালু!`);
    } else {
        delete medTimers[id]; btn.innerText = "Set Alert"; btn.style.backgroundColor = "#10b981";
    }
}

window.onload = initApp;