
const {
    hashPassword,
    verifyPassword,
  } = require("./password");
  
  async function testPassword() {
    try {
      const password = "HRMS-Test-Password-2026!";
  
      const hash = await hashPassword(password);
  
      console.log("Hash created:", hash.startsWith("$2"));
  
      const correctPassword = await verifyPassword(
        password,
        hash
      );
  
      console.log("Correct password:", correctPassword);
  
      const wrongPassword = await verifyPassword(
        "wrong-password",
        hash
      );
  
      console.log(
        "Wrong password rejected:",
        !wrongPassword
      );
  
    } catch (error) {
      console.error("Test failed:", error.message);
      process.exitCode = 1;
    }
  }
  
  testPassword();
  