const messageInput = document.querySelector(".message-input");
const chatBody = document.querySelector(".chat-body");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input")
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");
//API settings
const API_KEY = "AIzaSyA9vZOj-SS_Sygj3FO-Q-Ga1QjyBBruHhU"; // Replace with your actual API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const userData = {
    message : null,
    file: {
        data: null,
        mime_type: null,
    }
}

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const generateBotResponse = async(incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");
    //add chat user message to chat history
    chatHistory.push({
        role: "user",
        parts:[{text: userData.message}, ...(userData.file.data ? [{ inline_data : userData.file}] : [])],
})
    const requestOptions = {
        method: "POST",
        headers : { 
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: chatHistory,
       })
    }
    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if(!response.ok) {
            throw new Error(data.error.message);
        }
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messageElement.innerText = apiResponseText;
        // Add the response to chat history
        chatHistory.push({
        role: "model",
        parts:[{ text: apiResponseText }]
});
    }
    catch (error) {
        console.error(error);
        messageElement.innerText = error.message;
        messageElement.style.color = "#ff0000"; // Change text color to red on error
    } finally {
        //Reset userData after response
        userData.file = {}
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
}

const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    fileUploadWrapper.classList.remove("file-uploaded"); // Remove the file upload wrapper
    messageInput.dispatchEvent(new Event("input")); // Trigger input event to adjust height
    //create and display user message
    const messageContent = `<div class="message-text"></div>
                             ${userData.file.data ? `<img class="attachment" src="data:${userData.file.mime_type};base64,${userData.file.data}" />` : ""}`;
    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    setTimeout(()=>{
    const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                    <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
            </svg>
            <div class="message-text">
               <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
               </div> 
            </div>`;
    const incomingMessageDiv = createMessageElement(messageContent, "bot-message","thinking");
    chatBody.appendChild(incomingMessageDiv); 
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);   
    },600)
}

messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === "Enter" && userMessage && e.shifrKey && window.innerWidth > 768) {
        handleOutgoingMessage(e);
        messageInput.value = ""; // Clear the input field after sending the message
    }
});
// adjust the height of the message input field based on its content
messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight; // Adjust the form height to fit the input
    initialInputHeight ? "15px" : "32px";
})
//Handle file input change and preview the selected file
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) =>{
        fileUploadWrapper.querySelector("img").src = e.target.result; // Set the preview image to the file content
        fileUploadWrapper.classList.add("file-uploaded");
        const base64String = e.target.result.split(",")[1]; // Get the base64 string without the data URL prefix
        userData.file = {
        data: base64String,
        mime_type: file.type,
    }
        fileInput.value = ""; // Clear the file input after reading the file
    }
    reader.readAsDataURL(file); // Read the file as a data URL
});

fileCancelButton.addEventListener("click", () => {
    userData.file = {}; // Reset the file data
    fileUploadWrapper.classList.remove("file-uploaded"); // Remove the file upload wrapper
});

// Thay thế phần emoji picker trong JavaScript:

const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native, start, end, "end");
        messageInput.focus();        
    }
});

// Thêm picker vào form
document.querySelector(".chat-form").appendChild(picker);

// Xử lý click vào nút emoji
document.querySelector("#emoji-picker").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.toggle("show-emoji-picker");
});

// Ẩn picker khi click bên ngoài
document.addEventListener("click", (e) => {
    const emojiButton = document.querySelector("#emoji-picker");
    const emojiPicker = document.querySelector("em-emoji-picker");
    
    // Nếu click không phải vào nút emoji hoặc picker thì ẩn
    if (!emojiButton.contains(e.target) && !emojiPicker?.contains(e.target)) {
        document.body.classList.remove("show-emoji-picker");
    }
});
sendMessageButton.addEventListener("click", (e) => {
    handleOutgoingMessage(e);
    messageInput.value = ""; // Clear the input field after sending the message
});

document.querySelector("#file-upload").addEventListener("click",() => fileInput.click());
chatbotToggler.addEventListener("click",() => document.body.classList.toggle("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
