import { generatePassword } from "../password/generator";

console.log("PwmngerTS Content Script Loaded");

// Styles for the generator icon
const styles = `
  .pwmnger-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    background-image: url('${chrome.runtime.getURL("icon.png")}'); 
    background-size: contain;
    background-repeat: no-repeat;
    cursor: pointer;
    z-index: 10000;
    opacity: 0.5;
    transition: opacity 0.2s;
  }
  .pwmnger-icon:hover {
    opacity: 1;
  }
  .pwmnger-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "autofill") {
    const { username, password } = message;
    autofillFields(username, password);
  }
});

// --- Shadow DOM Support ---
function getAllInputs(root: Node = document): HTMLInputElement[] {
  let inputs: HTMLInputElement[] = [];
  
  // Get inputs in the current root
  if (root instanceof HTMLElement || root instanceof Document || root instanceof ShadowRoot) {
    const found = (root as any).querySelectorAll('input');
    if (found) inputs = Array.from(found);

    // Recursively search shadow roots of all elements
    const allElements = (root as any).querySelectorAll('*');
    for (const el of Array.from(allElements) as HTMLElement[]) {
      if (el.shadowRoot) {
        inputs = [...inputs, ...getAllInputs(el.shadowRoot)];
      }
    }
  }
  
  return inputs;
}

// --- Autofill Logic ---
function autofillFields(user: string, pass: string) {
  const allInputs = getAllInputs();
  const passwordInputs = allInputs.filter(input => input.type === "password");

  if (passwordInputs.length === 0) {
    console.log("No password fields found for auto-fill");
    return;
  }

  for (const passInput of passwordInputs) {
    // 1. Fill the password field
    setValue(passInput, pass);

    // 2. Try to find the username field associated with this password field
    const userInput = findUsernameField(passInput, allInputs);
    if (userInput) {
      setValue(userInput, user);
    }
  }
}

function findUsernameField(passInput: HTMLInputElement, allInputs: HTMLInputElement[]): HTMLInputElement | null {
  const form = passInput.form;
  
  // If in a form, look there first
  if (form) {
    const selectors = [
      'input[type="email"]',
      'input[name*="user"]',
      'input[name*="email"]',
      'input[name*="login"]',
      'input[id*="user"]',
      'input[id*="email"]',
      'input[autocomplete="username"]',
      'input[type="text"]'
    ];
    
    for (const selector of selectors) {
      const el = form.querySelector(selector) as HTMLInputElement;
      if (el && el !== passInput && el.type !== 'hidden' && el.type !== 'submit') return el;
    }
  }

  // Fallback: look for nearest input before the password field globally (including shadow DOM)
  const passIndex = allInputs.indexOf(passInput);
  if (passIndex > 0) {
    for (let i = passIndex - 1; i >= 0; i--) {
      const input = allInputs[i];
      if (input && (input.type === 'text' || input.type === 'email') && 
          window.getComputedStyle(input).display !== 'none') {
        return input;
      }
    }
  }

  return null;
}

function setValue(input: HTMLInputElement, value: string) {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.blur();
}

// --- Generator UI Injection ---
function injectGeneratorIcons() {
  const allInputs = getAllInputs();
  const passwordInputs = allInputs.filter(input => input.type === "password");
  
  passwordInputs.forEach((input: any) => {
    if (input.dataset.pwmngerInjected) return;
    
    // Only inject on likely registration fields or empty fields
    // if (input.autocomplete === "new-password" || !input.value) {
      
      const wrapper = document.createElement("div");
      wrapper.className = "pwmnger-wrapper";
      
      // We need to insert wrapper and move input inside, preventing layout breakage is hard.
      // A better approach is to position the icon relative to the input's parent if relative, or simply float it.
      // For stability, let's just create the icon and position it floating over the input using getBoundingClientRect
      
      // Simpler approach: Parent container shim
      // NOTE: Modifying DOM structure can break sites. 
      // Safest: Position absolute overlay appended to body, tracked on scroll/resize.
      
      // For this demo, let's append a sibling icon and use negative margin or absolute positioning if parent has relative.
      
      const parent = input.parentElement;
      if (parent) {
         const parentStyle = window.getComputedStyle(parent);
         if (parentStyle.position === 'static') {
           parent.style.position = 'relative'; 
         }
         
         const icon = document.createElement("div");
         icon.className = "pwmnger-icon";
         icon.title = "Generate Secure Password";
         icon.onclick = (e) => {
           e.preventDefault();
           e.stopPropagation();
           const password = generatePassword({
             length: 16,
             lowercase: true,
             uppercase: true,
             numbers: true,
             symbols: true
           });
           setValue(input as HTMLInputElement, password);
           
           // Notify background/popup to save this? 
           // Probably just fill it for now.
         };
         
         parent.appendChild(icon);
         input.dataset.pwmngerInjected = "true";
      }
    // }
  });
}

// Run injection periodically to handle dynamic forms
setInterval(injectGeneratorIcons, 2000);
injectGeneratorIcons();


// --- Credential Capture ---
function captureAndSend() {
  const allInputs = getAllInputs();
  const passwordInput = allInputs.find(input => input.type === 'password' && input.value);
  
  if (passwordInput) {
    const usernameInput = findUsernameField(passwordInput, allInputs);
    const username = usernameInput ? usernameInput.value : '';
    const password = passwordInput.value;
    const site = window.location.hostname;

    chrome.runtime.sendMessage({
      action: "capture-credentials",
      site,
      username,
      password
    });
  }
}

document.addEventListener('submit', captureAndSend, true);

// Fallback for form-less sites (detect click on anything that looks like a login button)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target && (
    target.tagName === 'BUTTON' || 
    target.getAttribute('role') === 'button' ||
    (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit')
  )) {
    // Small delay to let the password field be filled if it's dynamic
    setTimeout(captureAndSend, 100);
  }
}, true);
