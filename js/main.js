document.getElementById("year").textContent = new Date().getFullYear();

const inquiryForm = document.getElementById("parent-inquiry");

inquiryForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!inquiryForm.reportValidity()) return;

  const values = new FormData(inquiryForm);
  const details = [
    ["Parent or guardian", values.get("parentName")],
    ["Email", values.get("email")],
    ["Telephone", values.get("telephone")],
    ["Student", values.get("studentName")],
    ["Age", values.get("age")],
    ["Grade", values.get("grade")],
    ["Subject", values.get("subject")],
    ["Referred by", values.get("referralName") || "Not provided"],
    ["Areas of difficulty", values.get("difficulty") || "Not provided"],
  ].map(([label, value]) => label + ": " + value).join("\n");

  const subject = "Parent inquiry: " + values.get("studentName");
  const draftUrl = "mailto:info@fplearning.ca?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(details);
  window.open(draftUrl, "_blank", "noopener,noreferrer");
});
