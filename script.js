const form = document.getElementById("leadForm");
const sampleBtn = document.getElementById("sampleBtn");
const copyBtn = document.getElementById("copyBtn");

const keywords = {
  automation: ["automate", "automation", "manual", "repetitive", "workflow", "process", "spreadsheet"],
  lead: ["lead", "prospect", "follow-up", "follow up", "sales", "crm", "enquiry", "inquiry"],
  ai: ["ai", "artificial intelligence", "chatbot", "assistant", "openai"],
  web: ["website", "web app", "portal", "landing page", "booking"],
  integration: ["integration", "connect", "api", "sync", "stripe", "whatsapp", "google"]
};

function detectNeed(message) {
  const text = message.toLowerCase();
  const scores = Object.entries(keywords).map(([category, words]) => {
    const score = words.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
    return [category, score];
  }).sort((a,b) => b[1] - a[1]);

  const top = scores[0][1] ? scores[0][0] : "automation";
  return {
    automation: "Business process automation",
    lead: "Lead management and sales automation",
    ai: "AI assistant or intelligent workflow",
    web: "Website or custom web application",
    integration: "Systems and API integration"
  }[top];
}

function computeScore(data) {
  let score = 20;

  const team = Number(data.teamSize);
  const volume = Number(data.leadVolume);
  const budget = Number(data.budget);
  const messageLength = data.message.trim().length;

  if (team >= 15) score += 14;
  else if (team >= 5) score += 9;
  else score += 4;

  if (volume >= 200) score += 16;
  else if (volume >= 50) score += 11;
  else score += 5;

  if (budget >= 3000) score += 22;
  else if (budget >= 1000) score += 15;
  else score += 5;

  if (data.timeline === "urgent") score += 15;
  else if (data.timeline === "month") score += 12;
  else if (data.timeline === "quarter") score += 7;
  else score += 2;

  if (messageLength >= 180) score += 10;
  else if (messageLength >= 80) score += 7;
  else score += 3;

  const intentWords = ["need", "looking for", "want to", "problem", "currently", "save time", "reduce", "improve"];
  const hits = intentWords.filter(word =>
    data.message.toLowerCase().includes(word)
  ).length;

  score += Math.min(hits * 2, 8);
  return Math.min(score, 100);
}

function classify(score) {
  if (score >= 75) {
    return {
      label: "High-priority opportunity",
      status: "Hot lead",
      statusClass: "hot",
      potential: "High",
      response: "Within 2 hours",
      action: "Book a discovery call",
      reason: "Strong fit, clear intent and meaningful commercial value."
    };
  }

  if (score >= 50) {
    return {
      label: "Qualified opportunity",
      status: "Warm lead",
      statusClass: "warm",
      potential: "Medium",
      response: "Within 24 hours",
      action: "Send targeted questions",
      reason: "Promising fit, but key scope or budget details need confirmation."
    };
  }

  return {
    label: "Early-stage opportunity",
    status: "Nurture",
    statusClass: "cold",
    potential: "Low / uncertain",
    response: "Within 2 business days",
    action: "Share educational material",
    reason: "Interest exists, but buying readiness or project fit is still weak."
  };
}

function teamLabel(value) {
  const n = Number(value);

  if (n === 1) return "a solo operation";
  if (n === 5) return "a 2–5 person team";
  if (n === 15) return "a 6–20 person team";
  if (n === 50) return "a 21–100 person organisation";

  return "an organisation with more than 100 people";
}

function makeReply(data, need) {
  const firstName = data.fullName.trim().split(" ")[0];

  return `Hi ${firstName},

Thank you for sharing the situation at ${data.company}. Based on your message, the main opportunity appears to be ${need.toLowerCase()}.

The next useful step would be a short discovery call to understand your current workflow, the tools already in use and the result you want to achieve. After that, we can recommend a practical solution, timeline and fixed scope.

Would you be available for a 20-minute call this week?

Best regards,
FMSolutionsPro`;
}

function renderReport(data) {
  const score = computeScore(data);
  const classification = classify(score);
  const need = detectNeed(data.message);

  document.getElementById("emptyState").classList.add("hidden");
  document.getElementById("report").classList.remove("hidden");

  const statusPill = document.getElementById("statusPill");
  statusPill.textContent = classification.status;
  statusPill.className = `status ${classification.statusClass}`;

  document.getElementById("scoreValue").textContent = score;
  document.getElementById("scoreRing").style.setProperty("--score", `${score}%`);
  document.getElementById("priorityText").textContent = classification.label;
  document.getElementById("priorityReason").textContent = classification.reason;
  document.getElementById("needText").textContent = need;
  document.getElementById("potentialText").textContent = classification.potential;
  document.getElementById("responseTime").textContent = classification.response;
  document.getElementById("nextAction").textContent = classification.action;

  document.getElementById("summaryText").textContent =
    `${data.fullName} from ${data.company} represents ${teamLabel(data.teamSize)} receiving approximately ${data.leadVolume} leads per month. The request indicates a need for ${need.toLowerCase()}, with a stated project budget of approximately €${Number(data.budget).toLocaleString()}.`;

  document.getElementById("suggestedReply").textContent =
    makeReply(data, need);

  if (window.innerWidth < 900) {
    document.getElementById("resultCard").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  renderReport(data);
});

sampleBtn.addEventListener("click", () => {
  document.getElementById("fullName").value = "Sarah Johnson";
  document.getElementById("email").value = "sarah@northstarrealty.com";
  document.getElementById("company").value = "Northstar Realty";
  document.getElementById("teamSize").value = "15";
  document.getElementById("leadVolume").value = "200";
  document.getElementById("budget").value = "3000";
  document.getElementById("timeline").value = "month";

  document.getElementById("message").value =
    "Our real estate agency receives leads from our website, property portals and WhatsApp. The sales team manually copies every enquiry into spreadsheets and follow-up is inconsistent. We want to automate lead capture, qualification, assignment and reminders so agents respond faster and management can see the pipeline.";
});

copyBtn.addEventListener("click", async () => {
  const reply = document.getElementById("suggestedReply").textContent;

  try {
    await navigator.clipboard.writeText(reply);
    copyBtn.textContent = "Copied";
    setTimeout(() => copyBtn.textContent = "Copy reply", 1600);
  } catch {
    copyBtn.textContent = "Select and copy";
  }
});
