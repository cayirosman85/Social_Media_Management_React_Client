const BASE_URL = "https://localhost:7098";

export const apiFetch = async (endpoint, options = {}) => {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const isFormData = options.body instanceof FormData;
  if (isFormData) {
    delete defaultHeaders["Content-Type"];
  }

  const headers = { ...defaultHeaders, ...options.headers };
  const config = {
    ...options,
    headers,
    credentials: "include",
  };
  const url = `${BASE_URL}${endpoint}`;

  try {
    console.log(`API isteği gönderiliyor: ${url}`);
    const response = await fetch(url, config);
    const text = await response.text();
    console.log(`Ham yanıt: ${text}`);

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error(`Yanıt JSON formatında değil: ${text || "Boş yanıt"}`);
    }

    if (!response.ok) {
      throw new Error(
        data.Error || data.Errors?.join(", ") || `HTTP hatası! Durum: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error(`API isteği başarısız: ${endpoint}`, error);
    throw error;
  }
};