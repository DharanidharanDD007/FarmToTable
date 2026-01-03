const api = {
  loginUser: async (credentials) => {
    const response = await fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || "API Error");
      error.response = { data };
      throw error;
    }
    // The components expect the response wrapped in a 'data' property.
    return { data };
  },

  signupUser: async (userData) => {
    const response = await fetch("http://localhost:5000/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || "API Error");
      error.response = { data };
      throw error;
    }
    return { data };
  },
};
export default api;