import axios from "axios";

console.log("Testing live Render backend endpoint: https://arthur-backend-wilm.onrender.com/api/auth/send-otp ...");

axios.post("https://arthur-backend-wilm.onrender.com/api/auth/send-otp", {
  email: "atulyapandey1@gmail.com"
})
.then((response) => {
  console.log("🎉 Live Render API Response Success:", response.status, response.data);
})
.catch((error) => {
  console.error("❌ Live Render API Error:", error.response ? error.response.status : error.message, error.response ? error.response.data : "");
});
